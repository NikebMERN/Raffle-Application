import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key && !key.includes('your_key')) {
      this.stripe = new Stripe(key);
    }
  }

  async createCheckoutSession(userId: string, ticketIds: string[]) {
    if (!this.stripe) throw new BadRequestException('Stripe not configured');

    const tickets = await this.prisma.ticket.findMany({
      where: { id: { in: ticketIds }, status: { in: ['UNSOLD', 'ASSIGNED'] } },
      include: { raffle: true },
    });

    if (tickets.length !== ticketIds.length) {
      throw new BadRequestException('Some tickets are unavailable');
    }

    const raffleIds = new Set(tickets.map((t) => t.raffleId));
    if (raffleIds.size > 1) throw new BadRequestException('All tickets must be from the same raffle');

    const totalAmount = tickets.reduce((sum, t) => sum + Number(t.raffle.ticketPrice), 0);

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: totalAmount,
        status: 'PENDING',
        metadata: { ticketIds },
      },
    });

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: tickets.map((t) => ({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${t.raffle.title} - Ticket #${t.ticketNumber}`,
          },
          unit_amount: Math.round(Number(t.raffle.ticketPrice) * 100),
        },
        quantity: 1,
      })),
      success_url: `${this.config.get('FRONTEND_URL')}/dashboard/tickets?success=true`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/raffles/${tickets[0].raffleId}?cancelled=true`,
      metadata: { paymentId: payment.id, ticketIds: ticketIds.join(',') },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id },
    });

    return { sessionId: session.id, url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) return { received: true };

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret!);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    const existing = await this.prisma.stripeEvent.findUnique({ where: { eventId: event.id } });
    if (existing?.processed) return { received: true, duplicate: true };

    await this.prisma.stripeEvent.upsert({
      where: { eventId: event.id },
      update: {},
      create: { eventId: event.id, type: event.type, payload: event as unknown as object },
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.fulfillPayment(session);
    }

    await this.prisma.stripeEvent.update({
      where: { eventId: event.id },
      data: { processed: true },
    });

    return { received: true };
  }

  private async fulfillPayment(session: Stripe.Checkout.Session) {
    const paymentId = session.metadata?.paymentId;
    const ticketIds = session.metadata?.ticketIds?.split(',') || [];

    if (!paymentId) return;

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status === 'COMPLETED') return;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          stripePaymentIntentId: session.payment_intent as string,
        },
      });

      for (const ticketId of ticketIds) {
        const ticket = await tx.ticket.update({
          where: { id: ticketId },
          data: {
            status: 'SOLD',
            saleChannel: 'ONLINE',
            buyerId: payment.userId,
            soldAt: new Date(),
          },
          include: { raffle: true },
        });

        await tx.sale.create({
          data: {
            ticketId,
            userId: payment.userId,
            channel: 'ONLINE',
            amount: ticket.raffle.ticketPrice,
            paymentId,
          },
        });
      }
    });

    const user = await this.prisma.user.findUnique({ where: { id: payment.userId } });
    if (user) {
      await this.notifications.sendToUser(payment.userId, {
        channel: 'EMAIL',
        title: 'Ticket Purchase Confirmed',
        body: `Your ${ticketIds.length} ticket(s) have been purchased successfully.`,
        templateName: 'ticket_purchased',
      });
    }

    await this.audit.log({
      userId: payment.userId,
      action: 'PAYMENT_COMPLETED',
      entity: 'payment',
      entityId: paymentId,
      newValue: { ticketIds, amount: payment.amount },
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

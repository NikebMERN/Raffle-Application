import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ROLES = [
  { name: 'Super Admin', code: 'SUPER_ADMIN', description: 'Full system access' },
  { name: 'Finance', code: 'FINANCE', description: 'Financial operations' },
  { name: 'Community Seller', code: 'COMMUNITY_SELLER', description: 'Offline ticket sales' },
  { name: 'User', code: 'USER', description: 'Standard user' },
];

const MODULES = [
  'users', 'roles', 'permissions', 'sellers', 'ticket_books', 'tickets',
  'raffles', 'rounds', 'prizes', 'draws', 'winners', 'sales', 'rewards',
  'wallet', 'payments', 'notifications', 'templates', 'reports',
  'audit_logs', 'activity_logs', 'security_logs', 'settings', 'backups',
];

const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'BULK_ACTION', 'DRAW', 'SETTLE'] as const;

async function main() {
  console.log('Seeding MongoDB database...');

  const permissions = [];
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const perm = await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action },
      });
      permissions.push(perm);
    }
  }

  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { code: roleData.code },
      update: {},
      create: roleData,
    });

    const permsToAssign =
      roleData.code === 'SUPER_ADMIN'
        ? permissions
        : roleData.code === 'FINANCE'
          ? permissions.filter((p) =>
              ['wallet', 'payments', 'reports', 'sales', 'sellers', 'rewards', 'audit_logs'].includes(p.module) &&
              ['READ', 'EXPORT', 'SETTLE'].includes(p.action),
            )
          : roleData.code === 'COMMUNITY_SELLER'
            ? permissions.filter((p) =>
                ['ticket_books', 'tickets', 'sales'].includes(p.module) &&
                ['CREATE', 'READ', 'UPDATE'].includes(p.action),
              )
            : permissions.filter((p) =>
                ['raffles', 'tickets', 'wallet', 'payments'].includes(p.module) &&
                ['READ', 'CREATE'].includes(p.action),
              );

    for (const perm of permsToAssign) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  const adminRole = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@footballclub.example' },
    update: {},
    create: {
      email: 'admin@footballclub.example',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: true,
      roles: adminRole ? { create: { roleId: adminRole.id } } : undefined,
      wallet: { create: { balance: 0 } },
    },
  });

  const sellerRole = await prisma.role.findUnique({ where: { code: 'COMMUNITY_SELLER' } });
  const seller = await prisma.user.upsert({
    where: { email: 'seller@footballclub.example' },
    update: {},
    create: {
      email: 'seller@footballclub.example',
      passwordHash: await bcrypt.hash('Seller123!', 12),
      firstName: 'Community',
      lastName: 'Seller',
      emailVerified: true,
      roles: sellerRole ? { create: { roleId: sellerRole.id } } : undefined,
      wallet: { create: { balance: 0 } },
    },
  });

  const userRole = await prisma.role.findUnique({ where: { code: 'USER' } });
  await prisma.user.upsert({
    where: { email: 'user@footballclub.example' },
    update: {},
    create: {
      email: 'user@footballclub.example',
      passwordHash: await bcrypt.hash('User123!', 12),
      firstName: 'Demo',
      lastName: 'User',
      emailVerified: true,
      roles: userRole ? { create: { roleId: userRole.id } } : undefined,
      wallet: { create: { balance: 0 } },
    },
  });

  const settings = [
    { key: 'commission_rate', value: '0.10', description: 'Seller commission rate' },
    { key: 'club_name', value: 'Football Club Community', description: 'Club name' },
    { key: 'ticket_price_default', value: '5.00', description: 'Default ticket price GBP' },
    { key: 'max_tickets_per_user', value: '10', description: 'Max tickets per user' },
    { key: 'email_from', value: 'noreply@footballclub.example', description: 'Sender email' },
    { key: 'maintenance_mode', value: 'false', description: 'Maintenance mode' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  const templates = [
    {
      name: 'ticket_purchased',
      channel: 'EMAIL' as const,
      subject: 'Ticket Purchase Confirmation',
      body: 'Hello {{firstName}}, your ticket #{{ticketNumber}} for {{raffleTitle}} has been purchased.',
      variables: ['firstName', 'ticketNumber', 'raffleTitle'],
    },
    {
      name: 'draw_winner',
      channel: 'EMAIL' as const,
      subject: 'Congratulations! You Won!',
      body: 'Hello {{firstName}}, your ticket #{{ticketNumber}} won {{prizeName}} in {{raffleTitle}}!',
      variables: ['firstName', 'ticketNumber', 'prizeName', 'raffleTitle'],
    },
    {
      name: 'book_assigned',
      channel: 'EMAIL' as const,
      subject: 'Ticket Book Assigned',
      body: 'Hello {{firstName}}, ticket book #{{bookNumber}} (tickets {{start}}-{{end}}) has been assigned to you.',
      variables: ['firstName', 'bookNumber', 'start', 'end'],
    },
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { name: t.name },
      update: {},
      create: { ...t, variables: t.variables },
    });
  }

  let raffle = await prisma.raffle.findFirst({ where: { title: 'Season Finale Grand Draw' } });
  if (!raffle) {
    raffle = await prisma.raffle.create({
      data: {
        title: 'Season Finale Grand Draw',
        description: 'Win amazing prizes in our season finale community raffle!',
        status: 'ACTIVE',
        ticketPrice: 5.0,
        maxTicketsPerUser: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  let round = await prisma.raffleRound.findFirst({
    where: { raffleId: raffle.id, roundNumber: 1 },
  });
  if (!round) {
    round = await prisma.raffleRound.create({
      data: {
        raffleId: raffle.id,
        roundNumber: 1,
        title: 'Round 1 - Main Prize',
        status: 'OPEN',
        drawDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const existingPrize = await prisma.prize.findFirst({ where: { roundId: round.id, position: 1 } });
  if (!existingPrize) {
    await prisma.prize.create({
      data: {
        roundId: round.id,
        name: 'Signed Football Shirt',
        description: 'Official signed shirt from the first team',
        value: 150.0,
        position: 1,
      },
    });
  }

  const existingReward = await prisma.rewardConfiguration.findFirst({
    where: { name: 'Season Finale Reward Pool' },
  });
  if (!existingReward) {
    await prisma.rewardConfiguration.create({
      data: {
        name: 'Season Finale Reward Pool',
        raffleId: raffle.id,
        roundId: round.id,
        numberOfWinners: 3,
        totalRewardPool: 350,
        isActive: true,
        rewards: [
          { position: 1, name: '1st Prize - Signed Shirt', amount: 150, winnersCount: 1, description: 'First place winner' },
          { position: 2, name: '2nd Prize - Match Tickets', amount: 100, winnersCount: 1, description: 'Second place winner' },
          { position: 3, name: '3rd Prize - Club Merchandise', amount: 100, winnersCount: 1, description: 'Third place winner' },
        ],
      },
    });
  }

  let book = await prisma.ticketBook.findFirst({
    where: { raffleId: raffle.id, bookNumber: 'BOOK-001' },
  });
  if (!book) {
    book = await prisma.ticketBook.create({
      data: {
        raffleId: raffle.id,
        bookNumber: 'BOOK-001',
        sellerId: seller.id,
        startTicketNumber: 1,
        endTicketNumber: 50,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    });
  }

  for (let i = 1; i <= 50; i++) {
    const existing = await prisma.ticket.findFirst({
      where: { raffleId: raffle.id, ticketNumber: i },
    });
    if (!existing) {
      await prisma.ticket.create({
        data: {
          raffleId: raffle.id,
          roundId: round.id,
          bookId: book.id,
          ticketNumber: i,
          status: 'ASSIGNED',
          sellerId: seller.id,
        },
      });
    }
  }

  for (let i = 51; i <= 100; i++) {
    const existing = await prisma.ticket.findFirst({
      where: { raffleId: raffle.id, ticketNumber: i },
    });
    if (!existing) {
      await prisma.ticket.create({
        data: {
          raffleId: raffle.id,
          roundId: round.id,
          ticketNumber: i,
          status: 'UNSOLD',
        },
      });
    }
  }

  console.log('Seed complete!');
  console.log('Admin:', admin.email, '/ Admin123!');
  console.log('Seller:', seller.email, '/ Seller123!');
  console.log('Raffle ID:', raffle.id);
  console.log('Round ID:', round.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

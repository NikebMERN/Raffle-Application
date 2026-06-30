import { PrismaClient, PermissionAction } from '@prisma/client';
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

async function findOrCreatePermission(module: string, action: PermissionAction) {
  const existing = await prisma.permission.findFirst({ where: { module, action } });
  if (existing) return existing;
  return prisma.permission.create({ data: { module, action } });
}

async function findOrCreateRole(roleData: { name: string; code: string; description: string }) {
  const existing = await prisma.role.findUnique({ where: { code: roleData.code } });
  if (existing) return existing;
  return prisma.role.create({ data: roleData });
}

async function findOrCreateRolePermission(roleId: string, permissionId: string) {
  const existing = await prisma.rolePermission.findFirst({
    where: { roleId, permissionId },
  });
  if (existing) return existing;
  return prisma.rolePermission.create({ data: { roleId, permissionId } });
}

async function findOrCreateUser(data: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  roleId?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      emailVerified: data.emailVerified,
      roles: data.roleId ? { create: { roleId: data.roleId } } : undefined,
      wallet: { create: { balance: 0 } },
    },
  });
}

async function findOrCreateSetting(setting: { key: string; value: string; description: string }) {
  const existing = await prisma.systemSetting.findUnique({ where: { key: setting.key } });
  if (existing) {
    return prisma.systemSetting.update({
      where: { key: setting.key },
      data: { value: setting.value },
    });
  }
  return prisma.systemSetting.create({ data: setting });
}

async function findOrCreateTemplate(template: {
  name: string;
  channel: 'EMAIL';
  subject: string;
  body: string;
  variables: string[];
}) {
  const existing = await prisma.notificationTemplate.findFirst({ where: { name: template.name } });
  if (existing) return existing;
  return prisma.notificationTemplate.create({ data: { ...template, variables: template.variables } });
}

async function main() {
  console.log('Seeding MongoDB database...');

  const permissions = [];
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const perm = await findOrCreatePermission(module, action);
      permissions.push(perm);
    }
  }

  for (const roleData of ROLES) {
    const role = await findOrCreateRole(roleData);

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
      await findOrCreateRolePermission(role.id, perm.id);
    }
  }

  const adminRole = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await findOrCreateUser({
    email: 'admin@footballclub.example',
    passwordHash,
    firstName: 'Super',
    lastName: 'Admin',
    emailVerified: true,
    roleId: adminRole?.id,
  });

  const sellerRole = await prisma.role.findUnique({ where: { code: 'COMMUNITY_SELLER' } });
  const seller = await findOrCreateUser({
    email: 'seller@footballclub.example',
    passwordHash: await bcrypt.hash('Seller123!', 12),
    firstName: 'Community',
    lastName: 'Seller',
    emailVerified: true,
    roleId: sellerRole?.id,
  });

  const userRole = await prisma.role.findUnique({ where: { code: 'USER' } });
  await findOrCreateUser({
    email: 'user@footballclub.example',
    passwordHash: await bcrypt.hash('User123!', 12),
    firstName: 'Demo',
    lastName: 'User',
    emailVerified: true,
    roleId: userRole?.id,
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
    await findOrCreateSetting(setting);
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
    await findOrCreateTemplate(t);
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

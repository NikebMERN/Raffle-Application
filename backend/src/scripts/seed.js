require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');
const User = require('../models/User');
const Raffle = require('../models/Raffle');
const Settings = require('../models/Settings');
const RewardConfig = require('../models/RewardConfig');
const { ROLES, DEFAULTS } = require('../utils/constants');

async function seed() {
  await connectDatabase();
  console.log('Seeding SF Football Club Raffle database...');

  const passwordHash = await bcrypt.hash('Admin123!', DEFAULTS.BCRYPT_ROUNDS);

  const admin = await User.findOneAndUpdate(
    { email: 'admin@sffootballclub.example' },
    {
      email: 'admin@sffootballclub.example',
      username: 'sfadmin',
      passwordHash,
      firstName: 'SF',
      lastName: 'Admin',
      role: ROLES.SUPER_ADMIN,
      emailVerified: true,
      referralCode: 'SFADMIN01',
    },
    { upsert: true, new: true },
  );

  await User.findOneAndUpdate(
    { email: 'user@sffootballclub.example' },
    {
      email: 'user@sffootballclub.example',
      username: 'sfuser',
      passwordHash: await bcrypt.hash('User123!', DEFAULTS.BCRYPT_ROUNDS),
      firstName: 'Demo',
      lastName: 'User',
      role: ROLES.USER,
      emailVerified: true,
      referralCode: 'SFUSER001',
    },
    { upsert: true, new: true },
  );

  const settings = [
    { key: 'club_name', value: 'SF Football Club', category: 'general' },
    { key: 'total_tickets', value: DEFAULTS.TOTAL_TICKETS, category: 'raffle' },
    { key: 'required_sold', value: DEFAULTS.REQUIRED_SOLD, category: 'raffle' },
    { key: 'winners_count', value: DEFAULTS.WINNERS_COUNT, category: 'raffle' },
    { key: 'ticket_price', value: DEFAULTS.TICKET_PRICE, category: 'raffle' },
  ];

  for (const s of settings) {
    await Settings.findOneAndUpdate({ key: s.key }, s, { upsert: true });
  }

  let raffle = await Raffle.findOne({ roundNumber: 1 });
  if (!raffle) {
    const raffleService = require('../services/raffleService');
    raffle = await raffleService.createRaffle(
      {
        title: 'SF Football Club - Round 1',
        description: 'Season opener community raffle',
        totalTickets: DEFAULTS.TOTAL_TICKETS,
        ticketPrice: DEFAULTS.TICKET_PRICE,
        requiredSold: DEFAULTS.REQUIRED_SOLD,
        winnersCount: DEFAULTS.WINNERS_COUNT,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxTicketsPerUser: DEFAULTS.MAX_TICKETS_PER_USER,
      },
      admin._id,
    );
    await raffleService.publishRaffle(raffle._id, admin._id);
  }

  await RewardConfig.findOneAndUpdate(
    { name: 'Default 10-Winner Pool' },
    {
      name: 'Default 10-Winner Pool',
      raffleId: raffle._id,
      numberOfWinners: 10,
      totalRewardPool: 5000,
      isActive: true,
      rewards: [
        { position: 1, name: '1st Prize', amount: 1250, winnersCount: 1 },
        { position: 2, name: '2nd Prize', amount: 1000, winnersCount: 1 },
        { position: 3, name: '3rd Prize', amount: 750, winnersCount: 1 },
        { position: 4, name: '4th Prize', amount: 500, winnersCount: 1 },
        { position: 5, name: '5th Prize', amount: 400, winnersCount: 1 },
        { position: 6, name: '6th Prize', amount: 300, winnersCount: 1 },
        { position: 7, name: '7th Prize', amount: 250, winnersCount: 1 },
        { position: 8, name: '8th Prize', amount: 200, winnersCount: 1 },
        { position: 9, name: '9th Prize', amount: 200, winnersCount: 1 },
        { position: 10, name: '10th Prize', amount: 150, winnersCount: 1 },
      ],
      createdBy: admin._id,
    },
    { upsert: true },
  );

  console.log('Seed complete!');
  console.log('Admin: admin@sffootballclub.example / Admin123!');
  console.log('User:  user@sffootballclub.example / User123!');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

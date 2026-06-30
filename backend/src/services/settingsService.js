const settingsRepo = require('../repositories/settingsRepo');
const rafflesRepo = require('../repositories/rafflesRepo');
const rewardConfigsRepo = require('../repositories/rewardConfigsRepo');
const {
  DEFAULTS,
  BULK_DISCOUNTS,
  RAFFLE_STATUS,
} = require('../utils/constants');
const logger = require('../config/logger');

// -----------------------------------------------------------------------------
// Read-through cache over the Firestore `settings` collection.
//
// Services should read live configuration from here instead of the hardcoded
// `DEFAULTS` constants, so that values changed from the admin UI take effect
// without a code change. Constants remain as fallbacks when a key is unset.
// -----------------------------------------------------------------------------

const CACHE_TTL_MS = 60 * 1000;
let cache = null;
let cacheExpiry = 0;

async function loadAll() {
  if (cache && Date.now() < cacheExpiry) return cache;
  const list = await settingsRepo.list();
  cache = {};
  for (const s of list) cache[s.key] = s.value;
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return cache;
}

// Drop the cache so the next read reflects a just-saved value immediately.
function invalidate() {
  cache = null;
  cacheExpiry = 0;
}

function toNumber(value, fallback) {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (value !== null && value !== undefined && value !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

async function getValue(key, fallback = undefined) {
  const all = await loadAll();
  const v = all[key];
  return v === undefined || v === null || v === '' ? fallback : v;
}

// Resolved numeric raffle configuration, each value falling back to DEFAULTS.
async function getRaffleConfig() {
  const s = await loadAll();
  return {
    totalTickets: toNumber(s.total_tickets, DEFAULTS.TOTAL_TICKETS),
    requiredSold: toNumber(s.required_sold, DEFAULTS.REQUIRED_SOLD),
    winnersCount: toNumber(s.winners_count, DEFAULTS.WINNERS_COUNT),
    ticketPrice: toNumber(s.ticket_price, DEFAULTS.TICKET_PRICE),
    maxTicketsPerUser: toNumber(s.max_tickets_per_user, DEFAULTS.MAX_TICKETS_PER_USER),
    reserveTimeoutMs: toNumber(s.reserve_timeout_ms, DEFAULTS.RESERVE_TIMEOUT_MS),
    claimDeadlineDays: toNumber(s.claim_deadline_days, DEFAULTS.CLAIM_DEADLINE_DAYS),
    roundDurationDays: toNumber(s.round_duration_days, 30),
  };
}

// Bulk-discount tiers, falling back to the BULK_DISCOUNTS constant.
async function getBulkDiscounts() {
  const v = await getValue('bulk_discounts');
  return Array.isArray(v) && v.length ? v : BULK_DISCOUNTS;
}

async function getClubName() {
  return (await getValue('club_name')) || process.env.CLUB_NAME || 'Football Club';
}

// Non-sensitive values safe to expose to unauthenticated clients (branding,
// raffle parameters and feature flags the UI needs to render correctly).
async function getPublicConfig() {
  const cfg = await getRaffleConfig();
  return {
    clubName: await getClubName(),
    currency: (await getValue('currency')) || 'USD',
    ticketPrice: cfg.ticketPrice,
    totalTickets: cfg.totalTickets,
    requiredSold: cfg.requiredSold,
    winnersCount: cfg.winnersCount,
    maxTicketsPerUser: cfg.maxTicketsPerUser,
    features: {
      stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
    },
  };
}

// Default settings written on first run so the app is usable without any
// developer-run seed. Categories drive the grouping in the admin Settings UI.
const DEFAULT_SETTINGS = [
  { key: 'club_name', value: process.env.CLUB_NAME || 'Football Club', category: 'branding', description: 'Display name used across the public site and admin.' },
  { key: 'currency', value: 'USD', category: 'branding', description: 'ISO currency code for prices.' },
  { key: 'total_tickets', value: DEFAULTS.TOTAL_TICKETS, category: 'raffle', description: 'Tickets generated per round.' },
  { key: 'required_sold', value: DEFAULTS.REQUIRED_SOLD, category: 'raffle', description: 'Minimum tickets sold before a draw is allowed.' },
  { key: 'winners_count', value: DEFAULTS.WINNERS_COUNT, category: 'raffle', description: 'Number of winners drawn each round.' },
  { key: 'max_tickets_per_user', value: DEFAULTS.MAX_TICKETS_PER_USER, category: 'raffle', description: 'Maximum tickets a single user may hold per round.' },
  { key: 'round_duration_days', value: 30, category: 'raffle', description: 'Days until a new round’s deadline.' },
  { key: 'ticket_price', value: DEFAULTS.TICKET_PRICE, category: 'pricing', description: 'Price of a single ticket.' },
  { key: 'bulk_discounts', value: BULK_DISCOUNTS, category: 'pricing', description: 'Bulk-purchase discount tiers (minTickets / discount).' },
];

const DEFAULT_REWARD_CONFIG = {
  name: 'Default 10-Winner Pool',
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
};

// Idempotent first-run setup. Replaces the manual `npm run seed`: creates any
// missing default settings, the opening round and a default reward config.
// Safe to call on every boot — existing data is left untouched.
async function ensureBootstrap() {
  // raffleService is required lazily to keep the hot config path dependency-free.
  const raffleService = require('./raffleService');

  const existing = await settingsRepo.list();
  const existingKeys = new Set(existing.map((s) => s.key));
  let settingsCreated = 0;
  for (const s of DEFAULT_SETTINGS) {
    if (!existingKeys.has(s.key)) {
      await settingsRepo.upsert(s.key, s.value, s.description, s.category);
      settingsCreated += 1;
    }
  }
  if (settingsCreated) invalidate();

  const cfg = await getRaffleConfig();

  let raffle = null;
  const raffleCount = await rafflesRepo.count();
  if (raffleCount === 0) {
    raffle = await raffleService.createRaffle(
      {
        title: `${await getClubName()} — Round 1`,
        description: 'Season opener community raffle',
        totalTickets: cfg.totalTickets,
        ticketPrice: cfg.ticketPrice,
        requiredSold: cfg.requiredSold,
        winnersCount: cfg.winnersCount,
        maxTicketsPerUser: cfg.maxTicketsPerUser,
        startDate: new Date(),
        endDate: new Date(Date.now() + cfg.roundDurationDays * 24 * 60 * 60 * 1000),
      },
      'system-bootstrap',
    );
    await rafflesRepo.update(raffle.id, { status: RAFFLE_STATUS.ACTIVE });
  }

  let rewardCreated = false;
  const rewardCount = await rewardConfigsRepo.count();
  if (rewardCount === 0) {
    const target = raffle || (await rafflesRepo.getLatest());
    await rewardConfigsRepo.create({
      ...DEFAULT_REWARD_CONFIG,
      raffleId: target ? target.id : null,
      createdBy: 'system-bootstrap',
    });
    rewardCreated = true;
  }

  const summary = { settingsCreated, raffleCreated: Boolean(raffle), rewardCreated };
  if (settingsCreated || raffle || rewardCreated) {
    logger.info('Bootstrap applied', summary);
  }
  return summary;
}

module.exports = {
  loadAll,
  invalidate,
  getValue,
  getRaffleConfig,
  getBulkDiscounts,
  getClubName,
  getPublicConfig,
  ensureBootstrap,
  DEFAULT_SETTINGS,
};

const Ticket = require('../models/Ticket');
const Raffle = require('../models/Raffle');
const { TICKET_STATUS, RAFFLE_STATUS, DEFAULTS } = require('../utils/constants');
const { paginate, paginatedResponse } = require('../utils/helpers');

async function getAvailableTickets(raffleId, quantity) {
  const tickets = await Ticket.find({
    raffleId,
    status: TICKET_STATUS.AVAILABLE,
  }).limit(quantity);

  if (tickets.length < quantity) {
    throw Object.assign(new Error('Not enough tickets available'), { status: 400 });
  }
  return tickets;
}

async function reserveTickets(raffleId, userId, quantity) {
  const raffle = await Raffle.findById(raffleId);
  if (!raffle || raffle.status !== RAFFLE_STATUS.ACTIVE) {
    throw Object.assign(new Error('Raffle is not active'), { status: 400 });
  }

  const userTicketCount = await Ticket.countDocuments({
    raffleId,
    userId,
    status: { $in: [TICKET_STATUS.SOLD, TICKET_STATUS.RESERVED] },
  });

  if (userTicketCount + quantity > raffle.maxTicketsPerUser) {
    throw Object.assign(new Error('Max tickets per user exceeded'), { status: 400 });
  }

  const tickets = await getAvailableTickets(raffleId, quantity);
  const reservedUntil = new Date(Date.now() + DEFAULTS.RESERVE_TIMEOUT_MS);

  await Ticket.updateMany(
    { _id: { $in: tickets.map((t) => t._id) } },
    { status: TICKET_STATUS.RESERVED, userId, reservedUntil },
  );

  setTimeout(async () => {
    await Ticket.updateMany(
      { _id: { $in: tickets.map((t) => t._id) }, status: TICKET_STATUS.RESERVED, reservedUntil: { $lte: new Date() } },
      { status: TICKET_STATUS.AVAILABLE, userId: null, reservedUntil: null },
    );
  }, DEFAULTS.RESERVE_TIMEOUT_MS);

  return tickets;
}

async function assignTicketsPermanently(ticketIds, userId, price) {
  const now = new Date();
  await Ticket.updateMany(
    { _id: { $in: ticketIds } },
    { status: TICKET_STATUS.SOLD, userId, soldAt: now, price, reservedUntil: null },
  );
  return Ticket.find({ _id: { $in: ticketIds } });
}

async function releaseReservation(ticketIds) {
  await Ticket.updateMany(
    { _id: { $in: ticketIds }, status: TICKET_STATUS.RESERVED },
    { status: TICKET_STATUS.AVAILABLE, userId: null, reservedUntil: null },
  );
}

async function getTicketGrid(raffleId) {
  const tickets = await Ticket.find({ raffleId }).select('ticketNumber status').sort({ ticketNumber: 1 });
  return tickets;
}

async function listTickets(query) {
  const { page, limit, skip } = paginate(query);
  const filter = {};
  if (query.raffleId) filter.raffleId = query.raffleId;
  if (query.userId) filter.userId = query.userId;
  if (query.status) filter.status = query.status;

  const [data, total] = await Promise.all([
    Ticket.find(filter).populate('userId', 'firstName lastName email').skip(skip).limit(limit),
    Ticket.countDocuments(filter),
  ]);

  return paginatedResponse(data, total, page, limit);
}

module.exports = {
  reserveTickets,
  assignTicketsPermanently,
  releaseReservation,
  getTicketGrid,
  listTickets,
  getAvailableTickets,
};

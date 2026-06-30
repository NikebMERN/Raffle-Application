const EVENTS = require('./events');
const Raffle = require('../models/Raffle');

function registerHandlers(io, socket) {
  socket.on(EVENTS.CLIENT.JOIN_RAFFLE, async ({ raffleId }) => {
    socket.join(`raffle:${raffleId}`);
    const raffle = await Raffle.findById(raffleId);
    socket.emit(EVENTS.SERVER.TICKET_COUNT_UPDATE, {
      raffleId,
      soldCount: raffle?.soldCount || 0,
      totalTickets: raffle?.totalTickets || 0,
    });
  });

  socket.on(EVENTS.CLIENT.LEAVE_RAFFLE, ({ raffleId }) => {
    socket.leave(`raffle:${raffleId}`);
  });

  socket.on(EVENTS.CLIENT.PING, () => {
    socket.emit(EVENTS.SERVER.PONG);
  });

  socket.on(EVENTS.CLIENT.SEND_CHAT, ({ raffleId, message, user }) => {
    io.to(`raffle:${raffleId}`).emit(EVENTS.SERVER.CHAT_MESSAGE, { message, user, timestamp: new Date() });
  });

  socket.on(EVENTS.CLIENT.REQUEST_LEADERBOARD, async ({ raffleId }) => {
    const raffle = await Raffle.findById(raffleId);
    socket.emit(EVENTS.SERVER.TICKET_COUNT_UPDATE, {
      raffleId,
      soldCount: raffle?.soldCount || 0,
      progress: ((raffle?.soldCount || 0) / (raffle?.totalTickets || 1)) * 100,
    });
  });
}

module.exports = { registerHandlers };

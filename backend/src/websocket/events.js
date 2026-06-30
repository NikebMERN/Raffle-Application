const EVENTS = {
  CLIENT: {
    JOIN_RAFFLE: 'join_raffle',
    LEAVE_RAFFLE: 'leave_raffle',
    BUY_TICKETS: 'buy_tickets',
    GET_TICKET_UPDATE: 'get_ticket_update',
    SEND_CHAT: 'send_chat_message',
    REQUEST_LEADERBOARD: 'request_leaderboard',
    PING: 'ping',
  },
  SERVER: {
    TICKET_SOLD: 'ticket_sold',
    TICKET_COUNT_UPDATE: 'ticket_count_update',
    NEW_WINNER: 'new_winner',
    RAFFLE_STATUS_CHANGE: 'raffle_status_change',
    CHAT_MESSAGE: 'chat_message',
    DRAW_STARTED: 'draw_started',
    DRAW_COMPLETED: 'draw_completed',
    NEW_ROUND: 'new_round',
    NOTIFICATION: 'notification',
    PONG: 'pong',
  },
};

module.exports = EVENTS;

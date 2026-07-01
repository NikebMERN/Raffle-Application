module.exports = {
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
  },

  RAFFLE_STATUS: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    DRAWING: 'drawing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  TICKET_STATUS: {
    AVAILABLE: 'available',
    RESERVED: 'reserved',
    SOLD: 'sold',
    CANCELLED: 'cancelled',
    RETURNED: 'returned',
    LOST: 'lost',
    VOIDED: 'voided',
  },

  TRANSACTION_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },

  WALLET_TX: {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    TRANSFER_IN: 'transfer_in',
    TRANSFER_OUT: 'transfer_out',
    PURCHASE: 'purchase',
    REFUND: 'refund',
  },

  WALLET_LIMITS: {
    MIN_AMOUNT: 1,
    MAX_AMOUNT: 10000,
  },

  DEFAULTS: {
    TOTAL_TICKETS: 1000,
    REQUIRED_SOLD: 800,
    WINNERS_COUNT: 10,
    TICKET_PRICE: 5.0,
    MAX_TICKETS_PER_USER: 100,
    RESERVE_TIMEOUT_MS: 5 * 60 * 1000,
    CLAIM_DEADLINE_DAYS: 30,
  },

  PRIZE_DISTRIBUTION: [
    { rank: 1, percentage: 25 },
    { rank: 2, percentage: 20 },
    { rank: 3, percentage: 15 },
    { rank: 4, percentage: 10 },
    { rank: 5, percentage: 8 },
    { rank: 6, percentage: 6 },
    { rank: 7, percentage: 5 },
    { rank: 8, percentage: 4 },
    { rank: 9, percentage: 4 },
    { rank: 10, percentage: 3 },
  ],

  BULK_DISCOUNTS: [
    { minTickets: 100, discount: 0.25 },
    { minTickets: 50, discount: 0.2 },
    { minTickets: 25, discount: 0.15 },
    { minTickets: 10, discount: 0.1 },
    { minTickets: 5, discount: 0.05 },
  ],
};

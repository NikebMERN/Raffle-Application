const Joi = require('joi');

const passwordSchema = Joi.string()
  .min(8)
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[0-9]/, 'number')
  .pattern(/[^A-Za-z0-9]/, 'special')
  .required()
  .messages({
    'string.pattern.name': 'Password must include {#name} character',
  });

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: passwordSchema,
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  twoFactorCode: Joi.string().length(6).optional(),
});

const createRaffleSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  totalTickets: Joi.number().integer().min(1).default(1000),
  ticketPrice: Joi.number().min(0).default(5),
  requiredSold: Joi.number().integer().min(1).default(800),
  winnersCount: Joi.number().integer().min(1).default(10),
  prizePool: Joi.number().min(0).optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  maxTicketsPerUser: Joi.number().integer().min(1).default(100),
});

const purchaseSchema = Joi.object({
  raffleId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).max(100).required(),
  paymentMethod: Joi.string().valid('stripe', 'paypal', 'wallet').default('stripe'),
});

const rewardConfigSchema = Joi.object({
  name: Joi.string().required(),
  numberOfWinners: Joi.number().integer().min(1).required(),
  rewards: Joi.array()
    .items(
      Joi.object({
        position: Joi.number().integer().min(1).required(),
        name: Joi.string().required(),
        amount: Joi.number().min(0).required(),
        winnersCount: Joi.number().integer().min(1).default(1),
        description: Joi.string().optional(),
      }),
    )
    .min(1)
    .required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createRaffleSchema,
  purchaseSchema,
  rewardConfigSchema,
};

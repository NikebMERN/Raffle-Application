const { BULK_DISCOUNTS } = require('./constants');

function calculateBulkDiscount(quantity, discounts = BULK_DISCOUNTS) {
  for (const tier of discounts) {
    if (quantity >= tier.minTickets) return tier.discount;
  }
  return 0;
}

function calculateTotalPrice(quantity, unitPrice, discounts = BULK_DISCOUNTS) {
  const subtotal = quantity * unitPrice;
  const discount = calculateBulkDiscount(quantity, discounts);
  return {
    subtotal,
    discountRate: discount,
    discountAmount: subtotal * discount,
    total: subtotal * (1 - discount),
  };
}

function paginate(query, defaultLimit = 20) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

function paginatedResponse(data, total, page, limit) {
  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

function omit(obj, keys) {
  const result = { ...obj };
  keys.forEach((k) => delete result[k]);
  return result;
}

module.exports = {
  calculateBulkDiscount,
  calculateTotalPrice,
  paginate,
  paginatedResponse,
  omit,
};

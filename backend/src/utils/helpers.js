const { BULK_DISCOUNTS } = require('./constants');

function calculateBulkDiscount(quantity) {
  for (const tier of BULK_DISCOUNTS) {
    if (quantity >= tier.minTickets) return tier.discount;
  }
  return 0;
}

function calculateTotalPrice(quantity, unitPrice) {
  const subtotal = quantity * unitPrice;
  const discount = calculateBulkDiscount(quantity);
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

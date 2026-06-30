const { test } = require('node:test');
const assert = require('node:assert');
const { calculateTotalPrice } = require('../../src/utils/helpers');
const { PRIZE_DISTRIBUTION } = require('../../src/utils/constants');

test('bulk discount 10+ tickets gives 10%', () => {
  const result = calculateTotalPrice(10, 5);
  assert.equal(result.discountRate, 0.1);
  assert.equal(result.total, 45);
});

test('prize distribution sums to 100%', () => {
  const total = PRIZE_DISTRIBUTION.reduce((s, p) => s + p.percentage, 0);
  assert.equal(total, 100);
});

test('default config has 10 winners', () => {
  assert.equal(PRIZE_DISTRIBUTION.length, 10);
});

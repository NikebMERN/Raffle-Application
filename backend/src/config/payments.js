// Single source of truth for "are real card payments live?".
// Used to disable demo-only money shortcuts (e.g. free wallet top-up) once
// Stripe is configured for a real deployment.
function isStripeConfigured() {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && !key.includes('your_key') && !key.includes('REPLACE'));
}

module.exports = { isStripeConfigured };

const crypto = require('crypto');

function secureRandomInt(max) {
  return crypto.randomInt(0, max);
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hashParticipants(ticketIds) {
  const sorted = [...ticketIds].sort();
  return crypto.createHash('sha256').update(sorted.join(',')).digest('hex');
}

function generateDrawSeed() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { secureRandomInt, shuffleArray, hashParticipants, generateDrawSeed };

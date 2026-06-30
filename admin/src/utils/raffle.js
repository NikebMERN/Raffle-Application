// Mirrors the backend rule: a round is drawable only once it has sold out OR
// its deadline has passed, AND it has met the minimum required sold count.
export function getDrawEligibility(raffle) {
  if (!raffle) return { drawable: false, reason: 'No raffle' };
  const sold = raffle.soldCount || 0;
  const soldOut = sold >= raffle.totalTickets;
  const deadlinePassed = Boolean(raffle.endDate) && new Date(raffle.endDate) <= new Date();

  if (!soldOut && !deadlinePassed) {
    return { drawable: false, reason: 'Draw runs only when sold out or the deadline passes' };
  }
  if (sold < raffle.requiredSold) {
    return { drawable: false, reason: `Need at least ${raffle.requiredSold} sold to draw (have ${sold})` };
  }
  return { drawable: true, reason: 'Ready to draw' };
}

export function isDrawable(raffle) {
  return getDrawEligibility(raffle).drawable;
}

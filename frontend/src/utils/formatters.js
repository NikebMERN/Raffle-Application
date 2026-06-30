export function formatCurrency(n, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(n) || 0);
}

export function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(Number(n) || 0);
}

export function formatDate(d) {
  return new Date(d).toLocaleString('en-GB');
}

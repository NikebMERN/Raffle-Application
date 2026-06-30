export function formatCurrency(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
}

export function formatDate(d) {
  return new Date(d).toLocaleString('en-GB');
}

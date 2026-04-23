export function formatCount(n) {
  if (n < 1000) return n.toString();

  if (n < 1_000_000) {
    return (n / 1000).toFixed(1).replace('.', ',') + 'k';
  }

  return (n / 1_000_000).toFixed(1).replace('.', ',') + 'M';
}
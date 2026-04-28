export function timeAgo(dateString) {
  if (!dateString) return 'now';

  const now = new Date();
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'now';
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'now';

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
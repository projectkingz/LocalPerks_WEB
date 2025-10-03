/**
 * Format a date to "11-Jan-25 09:13am" format
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear().toString().slice(-2);
  
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = (hours % 12 || 12).toString().padStart(2, '0');

  return `${day}-${month}-${year} ${displayHours}:${minutes}${ampm}`;
}

/**
 * Format a date to show only the date part "11-Jan-25"
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDateOnly(date: string | Date): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear().toString().slice(-2);

  return `${day}-${month}-${year}`;
}

/**
 * Format a date to show only the time part "09:13am"
 * @param date - Date string or Date object
 * @returns Formatted time string
 */
export function formatTimeOnly(date: string | Date): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid time';
  }

  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = (hours % 12 || 12).toString().padStart(2, '0');

  return `${displayHours}:${minutes}${ampm}`;
} 
export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) {
    return '\u0024\u2014'
  }
  return '\u0024' + value.toFixed(2)
}

export function formatRating(value: number | null): string {
  if (value === null || value === undefined) {
    return '\u2014'
  }
  return value.toFixed(1) + '/5'
}

export function formatDate(value: string | null): string {
  if (!value) {
    return '\u2014'
  }
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return '\u2014'
    }
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return '\u2014'
  }
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined || minutes < 0) {
    return '\u2014'
  }
  if (minutes === 0) {
    return '0m'
  }
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) {
    return m + 'm'
  }
  if (m === 0) {
    return h + 'h'
  }
  return h + 'h ' + m + 'm'
}

export function getMediaLabel(type: 'movie' | 'tv', title: string, name?: string): string {
  if (type === 'tv' && name) {
    return name
  }
  return title
}

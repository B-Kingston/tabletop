export function isValidInstanceName(name: string): boolean {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 100
}

export function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 4
}

export function isValidRecipeTitle(title: string): boolean {
  return typeof title === 'string' && title.trim().length > 0 && title.length <= 200
}

export function isValidWineName(name: string): boolean {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 200
}

export function isValidRating(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0.0 && value <= 5.0
}

export function isValidCost(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0
}

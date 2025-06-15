/**
 * Currency utility functions for formatting and parsing currency values
 */

/**
 * Format a number as currency in Uzbek som
 * @param value - The number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0 so'm"
  }

  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a number as compact currency (e.g., 1M, 5K)
 * @param value - The number to format
 * @returns Formatted compact currency string
 */
export function formatCurrencyCompact(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0 so'm"
  }

  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Parse a currency string into a number
 * @param value - The currency string to parse
 * @returns Parsed number value
 */
export function parseCurrency(value: string): number {
  if (!value) return 0

  // Remove currency symbol, spaces, and commas
  const cleanValue = value
    .replace(/[₹,\s]/g, "")
    .replace(/so'm/g, "")
    .replace(/UZS/g, "")
  const parsedValue = Number.parseFloat(cleanValue)

  return isNaN(parsedValue) ? 0 : parsedValue
}

/**
 * Calculate total from an array of numbers
 * @param values - Array of numbers to sum
 * @returns Total sum
 */
export function calculateTotal(values: number[]): number {
  if (!values || !values.length) return 0

  return values.reduce((sum, value) => sum + (isNaN(value) ? 0 : value), 0)
}

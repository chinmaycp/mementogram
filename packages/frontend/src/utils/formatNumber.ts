/**
 * Formats a number into a compact string representation (K, M).
 * Example: 1234 -> 1.2K, 1500000 -> 1.5M
 * Uses Intl.NumberFormat for locale-aware formatting.
 * @param num - The number to format.
 * @returns A compact string representation of the number.
 */
export const formatCompactNumber = (num: number): string => {
  if (isNaN(num)) {
    return "0";
  }
  // Use Intl.NumberFormat for compact notation if available
  try {
    return Intl.NumberFormat("en-US", {
      // Use appropriate locale
      notation: "compact",
      maximumFractionDigits: 1, // Show one decimal place (e.g., 1.2K)
    }).format(num);
  } catch (error) {
    // Fallback for older environments or just return number if format fails
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  }
};

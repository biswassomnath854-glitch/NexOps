import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility to conditionally combine Tailwind CSS classes without conflict.
 * @param  {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

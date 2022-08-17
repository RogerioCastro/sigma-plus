/**
 * Creates a debounced function that delays invoking the provided function
 * until at least ms milliseconds have elapsed since its last invocation.
 * via: https://github.com/30-seconds/30-seconds-of-code/blob/master/snippets/debounce.md
 *
 * @param {Function} fn - debounced function.
 * @param {Number} ms - milliseconds.
 *
 * @returns {Function}.
 */
export default function debounce (fn, ms = 0) {
  let timeoutId
  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}

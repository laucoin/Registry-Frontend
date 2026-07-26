/**
 * Rows a list reads per chunk. The lists load on scroll, so this is not "how
 * much fits on a screen" but "how much is worth one round trip": small enough
 * that the first paint is quick, large enough that a reader scrolling steadily
 * is never waiting on the next request.
 */
export const DEFAULT_PAGE_SIZE = 20

export interface HighlightSegment {
	text: string
	match: boolean
}

/**
 * The backend search is trigram-based and accent-insensitive, so the terms it
 * matched are rarely the exact substring the user typed. Comparing on a
 * NORMALIZED copy (lowercased, diacritics stripped) while slicing the ORIGINAL
 * keeps "Zoe" highlighting inside "Zoé" without mangling what is displayed.
 *
 * The normalized form is built with NFD + a combining-mark strip, which is a
 * 1:1 mapping per character for every script Registry displays — so an index in
 * the normalized string is an index in the original.
 */
export function normalizeForSearch(value: string): string {
	return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Splits `text` into matched and unmatched runs for the terms in `query`.
 * Every whitespace-separated term is highlighted independently — the backend
 * matches on a whole search vector, so "jean dup" legitimately hits a row where
 * the two terms are far apart. Overlapping runs are merged so a character is
 * never emitted twice.
 *
 * Returns a single unmatched segment when there is nothing to highlight, which
 * keeps callers free of null checks.
 */
export function highlightSegments(text: string, query: string): HighlightSegment[] {
	const terms = query.trim().split(/\s+/).map(normalizeForSearch).filter(term => term.length > 0)
	if (!text || terms.length === 0) {
		return [{ text, match: false }]
	}

	const haystack = normalizeForSearch(text)
	const ranges: Array<[number, number]> = []
	for (const term of terms) {
		let from = haystack.indexOf(term)
		while (from !== -1) {
			ranges.push([from, from + term.length])
			from = haystack.indexOf(term, from + term.length)
		}
	}
	if (ranges.length === 0) {
		return [{ text, match: false }]
	}

	ranges.sort((a, b) => a[0] - b[0])
	const merged: Array<[number, number]> = []
	for (const [start, end] of ranges) {
		const previous = merged[merged.length - 1]
		if (previous && start <= previous[1]) {
			previous[1] = Math.max(previous[1], end)
		} else {
			merged.push([start, end])
		}
	}

	const segments: HighlightSegment[] = []
	let cursor = 0
	for (const [start, end] of merged) {
		if (start > cursor) {
			segments.push({ text: text.slice(cursor, start), match: false })
		}
		segments.push({ text: text.slice(start, end), match: true })
		cursor = end
	}
	if (cursor < text.length) {
		segments.push({ text: text.slice(cursor), match: false })
	}
	return segments
}

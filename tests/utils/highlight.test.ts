import { describe, expect, it } from 'vitest'
import { highlightSegments, normalizeForSearch } from '../../app/utils/highlight'

function marked(text: string, query: string): string[] {
	return highlightSegments(text, query).filter(segment => segment.match).map(segment => segment.text)
}

describe('normalizeForSearch', () => {
	it.each([
		['diacritics', 'Zoé', 'zoe'],
		['uppercase', 'DUPONT', 'dupont'],
		['a cedilla', 'François', 'francois'],
		['a plain string', 'nova', 'nova'],
		['an empty string', '', ''],
	])('strips %s', (_label, input, expected) => {
		// Arrange

		// Act + Assert
		expect(normalizeForSearch(input)).toBe(expected)
	})
})

describe('highlightSegments', () => {
	it('marks the searched term inside the result', () => {
		// Arrange
		const text = 'Jean DUPONT'

		// Act
		const segments = highlightSegments(text, 'dup')

		// Assert
		expect(segments).toEqual([
			{ text: 'Jean ', match: false },
			{ text: 'DUP', match: true },
			{ text: 'ONT', match: false },
		])
	})

	/**
	 * The backend search is accent-insensitive, so a row it returned may not
	 * contain the exact characters typed. Highlighting must follow the same rule
	 * or the match looks unexplained.
	 */
	it('marks an unaccented query inside an accented result, keeping the original text', () => {
		// Arrange
		const text = 'Zoé Ménard'

		// Act
		const segments = highlightSegments(text, 'zoe')

		// Assert
		expect(segments[0]).toEqual({ text: 'Zoé', match: true })
		expect(segments.map(segment => segment.text).join('')).toBe(text)
	})

	/**
	 * The backend matches on a whole search vector, so two distant terms
	 * legitimately hit the same row.
	 */
	it('marks every whitespace-separated term independently', () => {
		// Arrange

		// Act
		const found = marked('Jean DUPONT jean.dupont@example.org', 'jean example')

		// Assert
		expect(found).toEqual(['Jean', 'jean', 'example'])
	})

	it('marks every occurrence of a term, not just the first', () => {
		// Act
		const found = marked('ana banana', 'ana')

		// Assert
		expect(found).toEqual(['ana', 'ana'])
	})

	it('merges overlapping terms so a character is never emitted twice', () => {
		// Arrange

		// Act
		const segments = highlightSegments('banana', 'ban anana')

		// Assert
		expect(segments).toEqual([{ text: 'banana', match: true }])
		expect(segments.map(segment => segment.text).join('')).toBe('banana')
	})

	it.each([
		['an empty query', 'Jean DUPONT', ''],
		['a whitespace-only query', 'Jean DUPONT', '   '],
		['a query that matches nothing', 'Jean DUPONT', 'zzz'],
		['empty text', '', 'jean'],
	])('returns the text untouched for %s', (_label, text, query) => {
		// Act
		const segments = highlightSegments(text, query)

		// Assert
		expect(segments).toEqual([{ text, match: false }])
	})

	it('always reconstitutes the original text exactly', () => {
		// Arrange
		const text = 'Renault Clio · AB-123-CD'

		// Act
		const segments = highlightSegments(text, 'clio 123')

		// Assert
		expect(segments.map(segment => segment.text).join('')).toBe(text)
	})
})

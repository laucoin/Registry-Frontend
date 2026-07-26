import { describe, expect, it } from 'vitest'
import { STATUS_COLOR } from '../../app/utils/statusColors'

/**
 * WCAG relative luminance + contrast ratio — verifies the AA claim the palette
 * is built on (solid backgrounds with AntD's automatic white text).
 */
function channel(value: number): number {
	const c = value / 255
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function contrastVsWhite(hex: string): number {
	const r = Number.parseInt(hex.slice(1, 3), 16)
	const g = Number.parseInt(hex.slice(3, 5), 16)
	const b = Number.parseInt(hex.slice(5, 7), 16)
	const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
	return (1 + 0.05) / (luminance + 0.05)
}

describe('STATUS_COLOR', () => {
	it('exposes exactly the six status intents', () => {
		// Arrange

		// Act
		const keys = Object.keys(STATUS_COLOR).sort()

		// Assert
		expect(keys).toEqual(['accent', 'danger', 'info', 'neutral', 'success', 'warning'])
	})

	it.each(Object.entries(STATUS_COLOR))('%s is a six-digit hex colour', (_intent, hex) => {
		// Arrange

		// Act + Assert
		expect(hex).toMatch(/^#[0-9a-f]{6}$/)
	})

	it.each(Object.entries(STATUS_COLOR))('%s clears WCAG AA (≥ 4.5:1) with white text', (_intent, hex) => {
		// Arrange

		// Act
		const ratio = contrastVsWhite(hex)

		// Assert
		expect(ratio).toBeGreaterThanOrEqual(4.5)
	})

	/**
	 * The candidate is AntD's tinted-tag green text tone — the very thing this
	 * palette replaces.
	 */
	it('fails the AA check for a colour the palette must never contain (guard on the helper)', () => {
		// Arrange
		const tintedGreen = '#52c41a'

		// Act
		const ratio = contrastVsWhite(tintedGreen)

		// Assert
		expect(ratio).toBeLessThan(4.5)
	})
})

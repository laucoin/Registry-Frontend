import type { H3Event } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { backendLanguage } from '@server/utils/language'

/**
 * Spring answers in whatever `Accept-Language` says, so this decides the
 * language of every backend message and label the UI shows. It must follow the
 * app, never the browser: the two disagreeing is what put English rejections on
 * a French screen.
 */
const EVENT = {} as H3Event

let cookie: string | undefined

describe('backendLanguage', () => {
	beforeEach(() => {
		cookie = undefined
		vi.stubGlobal('getCookie', () => cookie)
		vi.stubGlobal('getRegistryConfig', () => ({ defaultLanguage: 'fr' }))
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it.each(['fr', 'en'])('follows the %s the user chose in the app', (language) => {
		// Arrange
		cookie = JSON.stringify({ themeMode: 'DARK', language })

		// Act + Assert
		expect(backendLanguage(EVENT)).toBe(language)
	})

	it.each([
		['no preference cookie', undefined],
		['a cookie holding only a theme', '{"themeMode":"DARK"}'],
		['a cookie that is not the shape we wrote', 'not-json'],
	])('falls back to the deploy default given %s', (_label, raw) => {
		// Arrange
		cookie = raw

		// Act + Assert
		expect(backendLanguage(EVENT)).toBe('fr')
	})
})

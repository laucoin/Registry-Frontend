import { describe, expect, it } from 'vitest'
import { apiErrorMessage } from '../../app/utils/apiError'

/**
 * Builds the shape a failed $fetch produces: an Error carrying the backend
 * ErrorDto on `data` (forwarded verbatim through the BFF proxy).
 */
function fetchError(data: unknown, message = 'fetch failed'): Error {
	return Object.assign(new Error(message), { data })
}

describe('apiErrorMessage', () => {
	it.each([
		[
			'the translated backend message over the title',
			fetchError({ message: 'Le mouvement est verrouillé', title: 'Conflict' }),
			'Le mouvement est verrouillé',
		],
		[
			'the backend title when no message is present',
			fetchError({ title: 'Conflict' }),
			'Conflict',
		],
		[
			'the raw fetch message when the ErrorDto has neither field',
			fetchError({ statusCode: 502 }, '502 Bad Gateway'),
			'502 Bad Gateway',
		],
		[
			'the error message for a plain Error without data',
			new Error('network down'),
			'network down',
		],
	])('prefers %s', (_label, error, expected) => {
		// Arrange

		// Act
		const message = apiErrorMessage(error)

		// Assert
		expect(message).toBe(expected)
	})

	it.each([
		['a thrown string', 'boom', 'boom'],
		['a thrown number', 404, '404'],
		['null', null, 'null'],
		['undefined', undefined, 'undefined'],
	])('stringifies %s (non-Error rejection)', (_label, error, expected) => {
		// Arrange

		// Act
		const message = apiErrorMessage(error)

		// Assert
		expect(message).toBe(expected)
	})

	it.each([
		['the BFF re-authentication signal', { statusCode: 401, code: 'REAUTHENTICATION_REQUIRED' }],
		['a service outage', { statusCode: 503, code: 'SERVICE_UNAVAILABLE' }],
	])('localizes %s instead of leaking the proxy\'s own wording', (_label, data) => {
		// Arrange
		const t = (key: string): string => `translated:${key}`
		const expected = data.code === 'SERVICE_UNAVAILABLE' ? 'common.serviceUnavailable' : 'common.sessionExpired'

		// Act
		const message = apiErrorMessage(fetchError(data), t)

		// Assert
		expect(message).toBe(`translated:${expected}`)
	})

	it('falls back to English for the re-authentication signal when no translator is given', () => {
		// Arrange
		const error = fetchError({ statusCode: 401, code: 'REAUTHENTICATION_REQUIRED' })

		// Act
		const message = apiErrorMessage(error)

		// Assert
		expect(message).toBe('Your session has expired. Signing you in again…')
	})

	it('keeps an empty backend message (nullish — not falsy — fallback)', () => {
		// Arrange
		const error = fetchError({ message: '', title: 'Conflict' })

		// Act
		const message = apiErrorMessage(error)

		// Assert
		expect(message).toBe('')
	})
})

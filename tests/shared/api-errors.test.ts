import {
	AUTH_REFUSAL_CODES,
	authRefusal,
	errorBody,
	isReauthRequired,
	REAUTH_REQUIRED_CODE,
} from '@shared/utils/api-errors'
import { describe, expect, it } from 'vitest'

/**
 * Builds the shape a failed $fetch produces: an Error carrying the BFF or
 * backend error body on `data`.
 */
function fetchError(data: unknown): Error {
	return Object.assign(new Error('fetch failed'), { data })
}

describe('errorBody', () => {
	it.each([
		['a failed $fetch', fetchError({ code: 'X' }), { code: 'X' }],
		['a plain Error', new Error('boom'), undefined],
		['null', null, undefined],
		['undefined', undefined, undefined],
	])('reads the body off %s', (_label, error, expected) => {
		// Arrange

		// Act
		const body = errorBody(error)

		// Assert
		expect(body).toEqual(expected)
	})
})

describe('isReauthRequired', () => {
	it('recognizes the BFF re-authentication signal by its code', () => {
		// Arrange
		const error = fetchError({ statusCode: 401, code: REAUTH_REQUIRED_CODE })

		// Act + Assert
		expect(isReauthRequired(error)).toBe(true)
	})

	it.each([
		['a plain 401 from Spring', fetchError({ statusCode: 401, code: 'NOT_AUTHENTICATED' })],
		['a service outage', fetchError({ statusCode: 503, code: 'SERVICE_UNAVAILABLE' })],
		['a body-less failure', new Error('network down')],
	])('leaves %s alone', (_label, error) => {
		// Arrange

		// Act + Assert
		expect(isReauthRequired(error)).toBe(false)
	})
})

describe('authRefusal', () => {
	it.each(AUTH_REFUSAL_CODES.map(code => [code]))('recognizes %s as a sign-in refusal', (code) => {
		// Arrange
		const error = fetchError({ statusCode: 403, code, message: 'refused' })

		// Act
		const refusal = authRefusal(error)

		// Assert
		expect(refusal).toEqual({ statusCode: 403, code, message: 'refused' })
	})

	it.each([
		['an ordinary domain conflict', fetchError({ statusCode: 409, code: 'PROJECT_DATE_CONFLICT_WITH_ELEMENTS' })],
		['the re-authentication signal', fetchError({ statusCode: 401, code: REAUTH_REQUIRED_CODE })],
		['a body without a code', fetchError({ statusCode: 500 })],
		['no body at all', new Error('boom')],
	])('returns null for %s', (_label, error) => {
		// Arrange

		// Act + Assert
		expect(authRefusal(error)).toBeNull()
	})
})

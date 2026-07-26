import { describe, expect, it } from 'vitest'
import { appendEmail, isValidEmail } from '../../app/utils/inviteEmails'

describe('isValidEmail', () => {
	it.each([
		['a plain address', 'nour@example.org', true],
		['an address with a plus tag', 'nour+registry@example.org', true],
		['a subdomain', 'nour@mail.example.co.uk', true],
		['surrounding whitespace', '  nour@example.org  ', true],
		['a missing domain', 'nour@', false],
		['a missing local part', '@example.org', false],
		['a domain without a dot', 'nour@example', false],
		['an inner space', 'no ur@example.org', false],
		['an empty string', '', false],
	])('accepts/rejects %s', (_label, candidate, expected) => {
		// Arrange

		// Act
		const valid = isValidEmail(candidate)

		// Assert
		expect(valid).toBe(expected)
	})
})

describe('appendEmail', () => {
	it('appends a valid address to the list', () => {
		// Arrange
		const emails = ['sam@example.org']

		// Act
		const result = appendEmail(emails, 'nour@example.org')

		// Assert
		expect(result).toEqual({ emails: ['sam@example.org', 'nour@example.org'], error: null })
	})

	it('trims the address before appending it', () => {
		// Arrange
		const emails: string[] = []

		// Act
		const result = appendEmail(emails, '  nour@example.org \n')

		// Assert
		expect(result.emails).toEqual(['nour@example.org'])
	})

	it('ignores an address the list already holds', () => {
		// Arrange
		const emails = ['nour@example.org']

		// Act
		const result = appendEmail(emails, 'nour@example.org')

		// Assert
		expect(result).toEqual({ emails: ['nour@example.org'], error: null })
	})

	it('reports a malformed address without touching the list', () => {
		// Arrange
		const emails = ['sam@example.org']

		// Act
		const result = appendEmail(emails, 'not-an-email')

		// Assert
		expect(result).toEqual({ emails: ['sam@example.org'], error: 'invalid' })
	})

	it.each([
		['an empty draft', ''],
		['a whitespace-only draft', '   '],
	])('is a no-op (not an error) for %s — the submit path flushes the field', (_label, draft) => {
		// Arrange
		const emails = ['sam@example.org']

		// Act
		const result = appendEmail(emails, draft)

		// Assert
		expect(result).toEqual({ emails: ['sam@example.org'], error: null })
	})

	it('never mutates the list it was given', () => {
		// Arrange
		const emails = ['sam@example.org']

		// Act
		appendEmail(emails, 'nour@example.org')

		// Assert
		expect(emails).toEqual(['sam@example.org'])
	})
})

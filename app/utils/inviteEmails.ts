/**
 * Client-side shape check only — a first-pass filter so an obvious typo is
 * caught before the round trip. The backend's @ValidEmails stays the authority
 * (PROJECT_PROFILE_EMAIL_INVALID), so this deliberately stays permissive rather
 * than trying to out-guess it.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(candidate: string): boolean {
	return EMAIL_PATTERN.test(candidate.trim())
}

export interface EmailAppendResult {
	emails: string[]
	error: 'invalid' | null
}

/**
 * Adds a typed address to the invite list: trims, rejects a malformed one, and
 * silently ignores a duplicate (re-adding an address the list already holds is
 * not an error, it is a no-op). An empty draft is also a no-op — the submit
 * path calls this to flush whatever was typed but not added, and a blank field
 * must not fail the submit.
 */
export function appendEmail(emails: readonly string[], candidate: string): EmailAppendResult {
	const email = candidate.trim()
	if (!email) {
		return { emails: [...emails], error: null }
	}
	if (!isValidEmail(email)) {
		return { emails: [...emails], error: 'invalid' }
	}
	return { emails: emails.includes(email) ? [...emails] : [...emails, email], error: null }
}

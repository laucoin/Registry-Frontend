/**
 * Error codes the client has to ACT on rather than merely display, shared by
 * the BFF (which emits the first two) and the app (which classifies them).
 */
export const REAUTH_REQUIRED_CODE = 'REAUTHENTICATION_REQUIRED'
export const SERVICE_UNAVAILABLE_CODE = 'SERVICE_UNAVAILABLE'

/**
 * Spring's sign-in refusals (security.md's JWT → user flowchart). They are
 * raised while converting the token, so EVERY authenticated call fails with the
 * same body for as long as the account stays in that state — a page that lets
 * each of its fetches surface one paints a storm of identical notices instead of
 * telling the user once that they cannot get in. Recognising them is what lets
 * the app collapse the whole class into a single global error screen.
 */
export const AUTH_REFUSAL_CODES: readonly string[] = [
	'AUTH_EMAIL_NOT_VERIFIED',
	'AUTH_EMAIL_ALREADY_USED',
	'AUTH_BLOCKED_ACCOUNT',
	'AUTH_EMAIL_OR_ID_NOT_FOUND_IN_TOKEN',
]

export interface RegistryErrorBody {
	statusCode?: number
	code?: string
	title?: string
	message?: string
}

export function errorBody(error: unknown): RegistryErrorBody | undefined {
	return (error as { data?: RegistryErrorBody } | undefined)?.data
}

export function isReauthRequired(error: unknown): boolean {
	return errorBody(error)?.code === REAUTH_REQUIRED_CODE
}

export function authRefusal(error: unknown): RegistryErrorBody | null {
	const body = errorBody(error)
	return body?.code && AUTH_REFUSAL_CODES.includes(body.code) ? body : null
}

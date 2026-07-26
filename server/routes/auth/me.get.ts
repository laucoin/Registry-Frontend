/**
 * Session introspection for the client (no cookie is created for anonymous
 * visitors — peekSession never mints one).
 */
export default defineEventHandler(async (event) => {
	const session = await peekSession(event)
	if (!session) {
		return { authenticated: false as const }
	}
	return {
		authenticated: true as const,
		user: session.data.user,
		csrf: session.data.csrf,
	}
})

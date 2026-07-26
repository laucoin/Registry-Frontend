/**
 * The BFF login route, with the post-login return path encoded. The
 * server side restricts `redirect` to same-site paths, so building it in one
 * place keeps every caller (middleware, session store, SSR bootstrap, the 401
 * interceptor) on the same escaping.
 */
export function loginPath(redirectTo = '/'): string {
	return `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
}

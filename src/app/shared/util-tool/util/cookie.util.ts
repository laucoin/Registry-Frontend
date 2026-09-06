/**
 * Reads a cookie the browser is willing to show us.
 *
 * Only the CSRF token qualifies: the session cookies are `HttpOnly` and deliberately invisible here.
 * Angular's own XSRF support cannot be used in their place — it attaches the header to same-origin
 * requests only, and the API is served from a sibling host.
 */
export class CookieUtils {
    public static get (name: string): string | undefined {
        const prefix: string = `${encodeURIComponent( name )}=`
        const match: string | undefined = document.cookie
            .split( '; ' )
            .find( (entry: string): boolean => entry.startsWith( prefix ) )

        return match ? decodeURIComponent( match.slice( prefix.length ) ) : undefined
    }
}

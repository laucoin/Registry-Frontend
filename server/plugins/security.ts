import { randomBytes } from 'node:crypto'

/**
 * The browser-security baseline, emitted by the Nuxt tier.
 * Final posture (Phase-0 spike verdict): strict nonce-based script-src — the
 * security-critical control — and pragmatic style-src 'unsafe-inline', because
 * ant-design-vue 4.x cannot nonce its client-injected component styles.
 * The `csp-nonce` meta is read by Vite's runtime asset loader, which stamps the
 * nonce on anything it injects (required by the strict script-src). Dev mode is
 * exempt from CSP entirely — Vite HMR injects un-nonced inline scripts — so CSP
 * behaviour is verified on the production build. The render:html chunk arrays
 * contain only framework-generated markup, never user content, so blanket
 * nonce-stamping via replaceAll is safe.
 *
 * The baseline headers hang off `beforeResponse`, not `render:response`: the
 * latter is fired only by Nitro's defineRenderHandler, i.e. the SSR HTML route,
 * which would leave the proxy (/api/**), the auth routes, /telemetry and the
 * public assets bare — and the proxy forwards the upstream content-type
 * verbatim, so a missing nosniff there is MIME-sniffable on our own origin.
 * `beforeResponse` is h3's onBeforeResponse, which every handled response goes
 * through. CSP stays on render:response: it needs the per-request nonce and
 * only governs the HTML document.
 */
export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook('request', (event) => {
		event.context.nonce = randomBytes(16).toString('base64')
	})

	nitroApp.hooks.hook('render:html', (html, { event }) => {
		const nonce = event.context.nonce as string
		const addNonce = (chunk: string) =>
			chunk
				.replaceAll('<script', `<script nonce="${nonce}"`)
				.replaceAll('<style', `<style nonce="${nonce}"`)
		html.head.unshift(`<meta property="csp-nonce" nonce="${nonce}">`)
		html.head = html.head.map(addNonce)
		html.bodyPrepend = html.bodyPrepend.map(addNonce)
		html.bodyAppend = html.bodyAppend.map(addNonce)
	})

	nitroApp.hooks.hook('render:response', (response, { event }) => {
		if (import.meta.dev) {
			return
		}
		const nonce = event.context.nonce as string
		const headers = (response.headers ??= {})
		headers['content-security-policy'] = [
			`default-src 'self'`,
			`script-src 'self' 'nonce-${nonce}'`,
			`style-src 'self' 'unsafe-inline'`,
			`img-src 'self' data:`,
			`font-src 'self' data:`,
			`connect-src 'self'`,
			`frame-ancestors 'none'`,
			`object-src 'none'`,
			`base-uri 'self'`,
			`form-action 'self'`,
		].join('; ')
	})

	nitroApp.hooks.hook('beforeResponse', (event) => {
		setResponseHeader(event, 'x-content-type-options', 'nosniff')
		setResponseHeader(event, 'referrer-policy', 'strict-origin-when-cross-origin')
		setResponseHeader(event, 'x-frame-options', 'DENY')
		setResponseHeader(event, 'permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=()')
		if (useRuntimeConfig(event).production) {
			setResponseHeader(event, 'strict-transport-security', 'max-age=31536000; includeSubDomains')
		}
	})
})

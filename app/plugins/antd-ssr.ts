import { createCache, extractStyle } from 'ant-design-vue/es/_util/cssinjs'

/**
 * Per-request cssinjs cache; after SSR the collected component
 * styles are extracted and inlined (nonced) into <head>, so the first paint is
 * fully styled: no FOUC, no client round-trip. (Internal import path — the
 * ant-design-vue version is pinned, see package.json.)
 */
export default defineNuxtPlugin((nuxtApp) => {
	const cache = createCache()

	if (import.meta.server) {
		nuxtApp.hook('app:rendered', ({ ssrContext }) => {
			if (!ssrContext) {
				return
			}
			const css = extractStyle(cache, true)
			const nonce = (ssrContext.event?.context?.nonce as string | undefined) ?? ''
			ssrContext.head.push({
				style: [{ 'innerHTML': css, nonce, 'data-antd-ssr': 'true' }],
			})
		})
	}

	return { provide: { antdCache: cache } }
})

import type { AppLanguage } from '@shared/utils/registry-config'
import type { H3Event } from 'h3'

const PREFERENCES_COOKIE = 'registry-preferences'

function persistedLanguage(raw: string | undefined): AppLanguage | undefined {
	if (!raw) {
		return undefined
	}
	try {
		return (JSON.parse(raw) as { language?: AppLanguage } | null)?.language
	} catch {
		return undefined
	}
}

/**
 * The language Spring must answer in. It translates its own error bodies and
 * label values off `Accept-Language`, and the browser's header is not the user's
 * choice of UI language — a French app read on an English-locale browser was
 * getting English rejections and English role labels. The app's own preference
 * decides instead: the persisted cookie first, then the deploy's default. A
 * visitor who has never chosen gets the same language the UI is rendering in,
 * which is what the two have to agree on.
 */
export function backendLanguage(event: H3Event): AppLanguage {
	return persistedLanguage(getCookie(event, PREFERENCES_COOKIE)) ?? getRegistryConfig().defaultLanguage
}

import { isReauthRequired } from '@shared/utils/api-errors'
import { useSessionStore } from '@stores/session'

/**
 * The one rule for offering a way back in, kept in a single place
 * because two surfaces carry the notice: the inline alert (ApiErrorAlert) and
 * the corner notification (useRegistryMessage's apiError).
 *
 * Only a re-authentication failure gets the offer. The BFF interceptor and the
 * SSR plugin already bounce to the IdP on their own, so "signing you in again"
 * is normally true — but that bounce is a full-page redirect which can be lost
 * (the IdP unreachable, the tab left in the background), leaving the reader in
 * front of a promise that already failed. Reconnecting runs the same store
 * action the interceptor does, returning to the page in view. Every other
 * failure gets no button: one that cannot fix anything only teaches the reader
 * that buttons here do nothing.
 */
export function useSessionReconnect() {
	const { t } = useI18n()
	const route = useRoute()
	const sessionStore = useSessionStore()

	return {
		offersReconnect: (error: unknown): boolean => isReauthRequired(error),
		reconnectLabel: computed(() => t('common.reconnect')),
		reconnect: (): void => sessionStore.login(route.fullPath),
	}
}

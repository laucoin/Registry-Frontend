import { Button, message, notification } from 'ant-design-vue'
import { h } from 'vue'

/**
 * Durations come from the public config's notification.duration (per
 * level, in milliseconds), so an operator can e.g. keep an error up long enough
 * to read a backend rule rejection. AntD takes seconds, so values are converted
 * here; a missing config (pre-hydration) falls back to AntD's own 3s default.
 *
 * TWO surfaces, deliberately, and they are not interchangeable:
 *
 *  - **Notifications** (`info` · `success` · `warn` · `error`) — the outcome of
 *    an action the user asked for. They stack in the corner, they do not sit
 *    over the content, and they are dismissible, so a failure can be read at
 *    leisure while the work continues. A toast centred at the top of the
 *    viewport covered the very toolbar the action came from and vanished on its
 *    own, which is the wrong shape for "your deletion was refused".
 *  - **Toasts** (`copied`) — the acknowledgement of a CLIPBOARD write and
 *    nothing else. It carries no information the user needs to keep, it just
 *    confirms the gesture landed, so it belongs at the bottom, brief and
 *    unstacked. Reserving the toast for this one case is what keeps it
 *    meaningful.
 *
 * Use this instead of importing `message`/`notification` directly.
 */
type NotificationLevel = 'info' | 'success' | 'warn' | 'error'

const DEFAULT_SECONDS = 3

/**
 * Clipboard confirmations are the only toast left, so the placement is set once
 * here rather than per call. AntD positions `message` from the TOP only, so
 * "bottom" is expressed as a large top offset — a viewport-relative value keeps
 * it anchored near the bottom edge at any height.
 */
const TOAST_TOP = 'calc(100vh - 96px)'
const TOAST_SECONDS = 2

export function useRegistryMessage() {
	const config = useRegistryConfigState()
	const { t } = useI18n()
	const { offersReconnect, reconnectLabel, reconnect } = useSessionReconnect()

	function seconds(level: NotificationLevel): number {
		const ms = config.value?.notification.duration[level]
		return typeof ms === 'number' ? ms / 1000 : DEFAULT_SECONDS
	}

	function notify(level: NotificationLevel, content: string): void {
		const open = level === 'warn' ? notification.warning : notification[level]
		open({
			message: content,
			duration: seconds(level),
			placement: 'bottomRight',
		})
	}

	/**
	 * A write that failed on a dead session gets the same offer the inline alert
	 * makes (useSessionReconnect); the button is built here rather than mounted
	 * from the SFC because AntD renders a static notification outside the app,
	 * where the component's own injections would not resolve.
	 */
	function apiError(error: unknown): void {
		const content = apiErrorMessage(error, t)
		if (!offersReconnect(error)) {
			notify('error', content)
			return
		}
		notification.error({
			message: content,
			duration: seconds('error'),
			placement: 'bottomRight',
			btn: () => h(
				Button,
				{
					'type': 'primary',
					'size': 'small',
					'data-testid': 'session-reconnect',
					'onClick': () => reconnect(),
				},
				() => reconnectLabel.value,
			),
		})
	}

	return {
		apiError,
		info: (content: string) => notify('info', content),
		success: (content: string) => notify('success', content),
		warn: (content: string) => notify('warn', content),
		error: (content: string) => notify('error', content),
		copied: (content: string) => message.open({
			type: 'success',
			content,
			duration: TOAST_SECONDS,
		}),
	}
}

/**
 * AntD keeps message placement in module-level config, so it is set once at
 * boot rather than per call. Called by the app plugin.
 */
export function configureRegistryToasts(): void {
	message.config({ top: TOAST_TOP, duration: TOAST_SECONDS })
}

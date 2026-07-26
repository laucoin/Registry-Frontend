import { message } from 'ant-design-vue'

// ADR 023 — toast durations come from the public config's notification.duration
// (per level, in milliseconds), so an operator can e.g. keep error toasts up
// long enough to read a backend rule rejection. AntD's message API takes the
// duration per call in SECONDS, so values are converted here; a missing config
// (pre-hydration) falls back to AntD's own 3s default. Use this instead of
// importing `message` directly wherever a toast is shown to the user.
type NotificationLevel = 'info' | 'success' | 'warn' | 'error'

const DEFAULT_SECONDS = 3

export function useRegistryMessage() {
	const config = useRegistryConfigState()

	function seconds(level: NotificationLevel): number {
		const ms = config.value?.notification.duration[level]
		return typeof ms === 'number' ? ms / 1000 : DEFAULT_SECONDS
	}

	return {
		info: (content: string) => message.info(content, seconds('info')),
		success: (content: string) => message.success(content, seconds('success')),
		warn: (content: string) => message.warning(content, seconds('warn')),
		error: (content: string) => message.error(content, seconds('error')),
	}
}

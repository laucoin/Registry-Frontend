// A live "time since" chronometer: a client ticker re-evaluates elapsed-time
// labels every 30s without refetching. Used by the project overview (ongoing
// outings) and the alerts list (alerts in progress). Reuses the
// `dashboard.overview.ongoing.*` duration format so labels read identically.
export function useElapsed() {
	const { t } = useI18n()
	const now = ref(Date.now())
	let timer: ReturnType<typeof setInterval> | undefined
	onMounted(() => {
		timer = setInterval(() => {
			now.value = Date.now()
		}, 30_000)
	})
	onBeforeUnmount(() => {
		if (timer) {
			clearInterval(timer)
		}
	})

	// Fuzzy under a minute (QA U8): "a few seconds" instead of a per-second
	// countdown — the 30s tick never has to chase exact seconds. Minutes stay
	// second-less; exact h+m only from one hour on.
	function elapsedSince(iso?: string | null): string {
		if (!iso) {
			return ''
		}
		const mins = Math.max(0, Math.floor((now.value - new Date(iso).getTime()) / 60_000))
		if (mins === 0) {
			return t('common.fewSeconds')
		}
		const hours = Math.floor(mins / 60)
		const rem = mins % 60
		return hours > 0
			? t('dashboard.overview.ongoing.hm', { h: hours, m: String(rem).padStart(2, '0') })
			: t('dashboard.overview.ongoing.m', { m: rem })
	}

	return { elapsedSince }
}

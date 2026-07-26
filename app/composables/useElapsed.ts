/**
 * A live "time since" chronometer: a client ticker re-evaluates elapsed-time
 * labels every 30s without refetching. Used by the project overview (ongoing
 * outings) and the alerts list (alerts in progress). Reuses the
 * `dashboard.overview.ongoing.*` duration format so labels read identically.
 */
export function useElapsed() {
	const { t } = useI18n()
	const now = ref(Date.now())

	/**
	 * Started on mount, not on setup: a ticker begun during a server render is a
	 * timer nobody ever stops.
	 */
	const { resume } = useIntervalFn(() => {
		now.value = Date.now()
	}, 30_000, { immediate: false })

	onMounted(resume)

	/**
	 * Fuzzy under a minute (QA U8): "a few seconds" instead of a per-second
	 * countdown — the 30s tick never has to chase exact seconds. Minutes stay
	 * second-less; exact h+m only from one hour on. The MAGNITUDE only: which
	 * side of now the instant falls on is the caller's to phrase.
	 */
	function duration(ms: number): string {
		const mins = Math.floor(Math.abs(ms) / 60_000)
		if (mins === 0) {
			return t('common.fewSeconds')
		}
		const hours = Math.floor(mins / 60)
		const rem = mins % 60
		return hours > 0
			? t('dashboard.overview.ongoing.hm', { h: hours, m: String(rem).padStart(2, '0') })
			: t('dashboard.overview.ongoing.m', { m: rem })
	}

	/**
	 * How long ago something happened. A FUTURE instant is not "a few seconds
	 * ago": clamping the difference to zero is how a departure scheduled next
	 * month read as having happened moments ago. Use [elapsedLabel] where the
	 * instant can legitimately be ahead of now.
	 */
	function elapsedSince(iso?: string | null): string {
		if (!iso) {
			return ''
		}
		return duration(Math.max(0, now.value - new Date(iso).getTime()))
	}

	/**
	 * The same magnitude, phrased in the right direction: "3 h ago" behind us,
	 * "in 3 h" ahead. For anything whose date is not guaranteed to be past —
	 * scheduled arrivals and departures, availability windows.
	 */
	function elapsedLabel(iso?: string | null): string {
		if (!iso) {
			return ''
		}
		const delta = now.value - new Date(iso).getTime()
		return delta < 0
			? t('common.inDuration', { duration: duration(delta) })
			: t('common.sinceDuration', { duration: duration(delta) })
	}

	/**
	 * Whether the instant is still ahead of now — lets a caller style or gate on
	 * direction without re-parsing the date.
	 */
	function isUpcoming(iso?: string | null): boolean {
		return !!iso && new Date(iso).getTime() > now.value
	}

	return { duration, elapsedSince, elapsedLabel, isUpcoming, nowMs: now }
}

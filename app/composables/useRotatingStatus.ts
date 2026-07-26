/**
 * How long each step of a long operation stays on screen. Long enough to read,
 * short enough that the message visibly moves — a line that never changes is
 * indistinguishable from a frozen dialog, which is the anxiety this exists to
 * answer.
 */
export const ROTATING_STATUS_INTERVAL_MS = 2200

/**
 * A rotating "what is happening now" line for an operation whose duration we
 * cannot know. Deleting a project cascades through movements, communications,
 * participants and the rest; the API answers once, at the end, so the only
 * honest thing the UI can say is what the work consists of — in order, one step
 * at a time.
 *
 * The steps are NOT progress: nothing here is reported by the server, and the
 * copy says "we are deleting…", never "42% done". The last step stays on screen
 * rather than looping back to the first, so a long wait does not read as a
 * restart.
 */
export function useRotatingStatus(steps: () => string[]) {
	const index = ref(0)

	const current = computed(() => steps()[Math.min(index.value, steps().length - 1)] ?? '')

	const { pause: stop, resume } = useIntervalFn(() => {
		if (index.value < steps().length - 1) {
			index.value += 1
		}
	}, ROTATING_STATUS_INTERVAL_MS, { immediate: false })

	function start(): void {
		index.value = 0
		resume()
	}

	return { current, index, start, stop }
}

/**
 * The one place the layout asks "is this a small screen?". Mirrors the
 * breakpoints `app/assets/css/responsive.css` already uses, so a component's
 * behaviour and the stylesheet can never disagree about where the layout
 * changes shape.
 *
 * SSR has no viewport: every query starts `false` (the desktop shape) and
 * resolves on mount. That way the server-rendered markup is deterministic and
 * hydration cannot mismatch — a component that must not flash should gate on
 * `ready`.
 */
export const BREAKPOINT = {
	mobile: 575,
	compact: 767,
} as const

export type BreakpointName = keyof typeof BREAKPOINT

export function useBreakpoint(name: BreakpointName = 'compact') {
	const matches = ref(false)
	const ready = ref(false)

	onMounted(() => {
		const query = window.matchMedia(`(max-width: ${BREAKPOINT[name]}px)`)
		const apply = (event: MediaQueryList | MediaQueryListEvent): void => {
			matches.value = event.matches
		}
		apply(query)
		ready.value = true
		query.addEventListener('change', apply)
		onBeforeUnmount(() => query.removeEventListener('change', apply))
	})

	return { matches, ready }
}

/**
 * Drawer placement, in one place: a sheet rising from the BOTTOM on a phone
 * (where the thumb is, and where a right-hand panel would cover the whole
 * screen anyway) and a side panel from the RIGHT on a wide screen. Returns the
 * height/width AntD needs for each orientation, since a bottom drawer sized in
 * `width` is silently ignored.
 */
export function useDrawerPlacement() {
	const { matches: isMobile } = useBreakpoint('mobile')

	return {
		isMobile,
		placement: computed(() => (isMobile.value ? 'bottom' as const : 'right' as const)),
		height: computed(() => (isMobile.value ? '85vh' : undefined)),
	}
}

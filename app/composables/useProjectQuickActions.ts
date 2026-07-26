import type { MovementSeed } from '@/components/project/MovementDrawer.vue'

interface QuickActionsState {
	movementOpen: boolean
	movementSeed: MovementSeed | undefined
	alertOpen: boolean
	movementsVersion: number
}

/**
 * The shared handle on the project's quick-create panels.
 *
 * The forms are rendered ONCE, by ProjectQuickActions in the project shell, and
 * asked for from anywhere inside the project — the floating button, a "due
 * today" row on the dashboard. Each caller rendering its own copy would mean
 * several drawers mounted over the same page, each running its own eligibility
 * and vehicle fetches for a panel the operator never opened.
 *
 * `useState` rather than a module-level ref: on the server one module instance
 * is shared by every concurrent request, so a plain ref would leak one visitor's
 * open panel — and the participant it names — into another's render.
 */
export function useProjectQuickActions() {
	const state = useState<QuickActionsState>('project-quick-actions', () => ({
		movementOpen: false,
		movementSeed: undefined,
		alertOpen: false,
		movementsVersion: 0,
	}))

	/**
	 * The seed is set before the panel opens, so the drawer reads the caller's
	 * intent on the same tick it starts loading. Opening with no seed clears the
	 * previous one — an empty form must not inherit the last person recorded.
	 */
	function openMovement(seed?: MovementSeed): void {
		state.value.movementSeed = seed
		state.value.movementOpen = true
	}

	function openAlert(): void {
		state.value.alertOpen = true
	}

	function movementRecorded(): void {
		state.value.movementsVersion += 1
	}

	return { state, openMovement, openAlert, movementRecorded }
}

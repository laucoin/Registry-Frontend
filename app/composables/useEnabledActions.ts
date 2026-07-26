/**
 * Per-deployment action gating. `enabledActions` in the public config
 * lists which optional operations an instance exposes; an action button must be
 * shown only when its authority is present AND the action is enabled here (the
 * v1 app gated the same way via `AppConfig.config.enabledActions.includes(...)`).
 * A missing config (pre-hydration) enables nothing, so nothing flashes then
 * hides.
 */
export type RegistryAction
	= | 'USER_UPDATE'
	| 'USER_BLOCK'
	| 'USER_UNBLOCK'
	| 'USER_DELETE'
	| 'PROJECT_SELECT_PROFILE'
	| 'PROJECT_CREATE_SUPPORT_PROFILE'
	| 'PROJECT_UPDATE'
	| 'PROJECT_DISABLE'
	| 'PROJECT_ENABLE'
	| 'PROJECT_DELETE'

export function useEnabledActions() {
	const config = useRegistryConfigState()
	const enabled = computed(() => new Set(config.value?.enabledActions ?? []))
	const isActionEnabled = (action: RegistryAction): boolean => enabled.value.has(action)
	return { isActionEnabled }
}

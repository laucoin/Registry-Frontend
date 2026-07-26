<script setup lang="ts">
import { useSessionStore } from '@stores/session'

/**
 * The project's quick-create control, and the single mount point for the two
 * forms behind it.
 *
 * It floats over every page of the project rather than sitting on the dashboard
 * because the two things it opens are the two things that happen while an event
 * is RUNNING: someone arrives or leaves, or something goes wrong. Both are
 * noticed at unpredictable moments, on whichever page the operator happens to
 * have open, and a control that only exists on the landing page turns each of
 * them into a navigation first.
 *
 * Gating mirrors the backend conjunctions exactly, so the button never offers a
 * form whose submit would be refused; with neither action available it renders
 * nothing at all rather than an empty menu.
 */
const props = defineProps<{ projectId: string }>()

const { t } = useI18n()
const sessionStore = useSessionStore()
const { state, openMovement, openAlert, movementRecorded } = useProjectQuickActions()

const canCreateMovement = computed(() =>
		sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_MOVEMENT_C'))
/**
 * The same conjunction PROJECT_DOMAINS uses for the alerts domain: the option
 * gates the module, the authority gates the write.
 */
const canCreateAlert = computed(() =>
		sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_OPTION_ALERT')
		&& sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_ALERT_C'))

const actions = computed(() => [
	...(canCreateMovement.value
		? [{ key: 'movement', label: t('movements.add'), run: () => openMovement() }]
		: []),
	...(canCreateAlert.value
		? [{ key: 'alert', label: t('alerts.add'), run: () => openAlert() }]
		: []),
])

/**
 * One available action needs no menu: the button IS that action, and is
 * labelled with it. Two get a small list, opened from the same button.
 */
const menuOpen = ref(false)

function run(action: { run: () => void }): void {
	menuOpen.value = false
	action.run()
}

function onTriggerClick(): void {
	if (actions.value.length === 1) {
		run(actions.value[0]!)
		return
	}
	menuOpen.value = !menuOpen.value
}

const triggerLabel = computed(() =>
	(actions.value.length === 1 ? actions.value[0]!.label : t('projectQuickActions.label')))

const route = useRoute()

watch(() => route.fullPath, () => {
	menuOpen.value = false
})

/**
 * A menu that swallows the click closing it would leave the operator pressing
 * outside twice; Escape closes it too, since it is a popup over the page.
 */
function onKeydown(event: KeyboardEvent): void {
	if (event.key === 'Escape') {
		menuOpen.value = false
	}
}

/**
 * Recording a movement changes what every dashboard panel counts, so the panels
 * are reloaded rather than left showing the presence from before the entry the
 * operator just recorded. Keys that no panel holds are simply no-ops.
 */
function onMovementCreated(): void {
	movementRecorded()
	refreshNuxtData([
		`overview-presence-${props.projectId}`,
		`overview-vehicles-${props.projectId}`,
		`overview-arrivals-${props.projectId}`,
		`overview-departures-${props.projectId}`,
		`overview-ongoing-${props.projectId}`,
		`movements-${props.projectId}`,
		`presence-board-${props.projectId}`,
	])
}

function onAlertSaved(): void {
	refreshNuxtData([`overview-alerts-${props.projectId}`, `alerts-${props.projectId}`])
}
</script>

<template>
	<div v-if="actions.length > 0">
		<div
				class="quick-actions"
				@keydown="onKeydown"
		>
			<ul
					v-if="menuOpen"
					class="quick-actions__menu"
					data-testid="project-quick-actions-menu"
			>
				<li
						v-for="action in actions"
						:key="action.key"
				>
					<button
							type="button"
							class="quick-actions__item"
							:data-testid="`project-quick-action-${action.key}`"
							@click="run(action)"
					>
						{{ action.label }}
					</button>
				</li>
			</ul>

			<button
					type="button"
					class="quick-actions__trigger"
					:aria-label="triggerLabel"
					:aria-haspopup="actions.length > 1 ? 'menu' : undefined"
					:aria-expanded="actions.length > 1 ? menuOpen : undefined"
					data-testid="project-quick-actions"
					@click="onTriggerClick"
			>
				<svg
						viewBox="0 0 24 24"
						width="24"
						height="24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						aria-hidden="true"
				>
					<path d="M12 5v14"/>
					<path d="M5 12h14"/>
				</svg>
			</button>
		</div>

		<ProjectMovementDrawer
				v-if="canCreateMovement"
				v-model:open="state.movementOpen"
				:project-id="projectId"
				:seed="state.movementSeed"
				@created="onMovementCreated"
		/>
		<ProjectAlertDrawer
				v-if="canCreateAlert"
				v-model:open="state.alertOpen"
				:project-id="projectId"
				@saved="onAlertSaved"
		/>
	</div>
</template>

<style scoped>
.quick-actions {
	position: fixed;
	right: max(20px, env(safe-area-inset-right));
	bottom: max(20px, env(safe-area-inset-bottom));
	z-index: 900;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 10px;
}

.quick-actions__trigger {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 56px;
	height: 56px;
	border: none;
	border-radius: 50%;
	background: var(--focus);
	color: #fff;
	box-shadow: var(--shadow-md);
	cursor: pointer;
	transition: transform var(--dur-1) var(--ease-out), box-shadow var(--dur-1) var(--ease-out);
}

.quick-actions__trigger:hover {
	transform: translateY(-2px);
	box-shadow: var(--shadow-lg, var(--shadow-md));
}

.quick-actions__trigger:focus-visible {
	outline: 2px solid var(--focus);
	outline-offset: 3px;
}

.quick-actions__menu {
	list-style: none;
	margin: 0;
	padding: 6px;
	display: flex;
	flex-direction: column;
	gap: 2px;
	border-radius: 12px;
	border: 1px solid var(--hairline);
	background: var(--surface);
	box-shadow: var(--shadow-md);
}

.quick-actions__item {
	width: 100%;
	padding: 8px 14px;
	border: none;
	border-radius: 8px;
	background: none;
	color: inherit;
	font: inherit;
	text-align: right;
	white-space: nowrap;
	cursor: pointer;
}

.quick-actions__item:hover {
	background: color-mix(in srgb, var(--focus) 10%, transparent);
}

.quick-actions__item:focus-visible {
	outline: 2px solid var(--focus);
	outline-offset: -2px;
}

/* The whole control is motion on top of a button that already works. */
@media (prefers-reduced-motion: reduce) {
	.quick-actions__trigger {
		transition: none;
	}

	.quick-actions__trigger:hover {
		transform: none;
	}
}
</style>

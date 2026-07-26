<script setup lang="ts">
import { FIELD_LIMIT } from '@shared/utils/field-limits'
import { useSessionStore } from '@stores/session'
import {
	Button,
	DatePicker,
	Drawer,
	Empty,
	Input,
	Modal,
	RadioGroup,
	Space,
	Tag,
	Textarea,
} from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

/**
 * The discussion thread attached to a movement OR an alert — communications
 * are only ever read beside the record they concern (there is no standalone
 * list). Reads `/movements/{id}/communications` or `/alerts/{id}/communications`
 * and composes/edits/deletes via the project communications endpoints, sending
 * `movementId` or `alertId` accordingly (@AtLeastOneIsDefined). The caller
 * gates opening on the matching *_COMMUNICATION_R authority; write actions
 * gate on the communication C/U/D authorities here.
 */
interface ThreadComm {
	id: string
	dateTime?: string | null
	message?: string | null
	onBehalfOfMovement?: boolean
	movement?: { id?: string | null, dateTime?: string | null, reason?: { label?: string | null } | null } | null
	creation?: {
		dateTime?: string | null
		user?: { firstName?: string | null, lastName?: string | null, email?: string | null } | null
	} | null
	lastEdition?: { dateTime?: string | null } | null
}

const props = defineProps<{
	projectId: string
	movementId?: string | null
	alertId?: string | null
	seedDateTime?: string | null
	activityLinked?: boolean
}>()
const open = defineModel<boolean>('open', { default: false })

/**
 * Raised when a message escalated into an alert — new or existing. What the
 * board shows has changed, and only the caller knows which of its panels.
 */
const emit = defineEmits<{ escalated: [] }>()

const { t, d } = useI18n()
const registryMessage = useRegistryMessage()
const sessionStore = useSessionStore()

const targetId = computed(() => props.movementId ?? props.alertId ?? null)
const readPath = computed(() => (props.movementId
		? `/api/v2/projects/${props.projectId}/movements/${props.movementId}/communications`
		: `/api/v2/projects/${props.projectId}/alerts/${props.alertId}/communications`))

/**
 * Movement thread: the composer chooses between "as myself" and "as the
 * movement" (onBehalfOfMovement flag). Alert thread: attaching a movement
 * from the attachable set (current activity outings) IS the movement voice —
 * the message then also carries that movementId.
 */
const movementVoice = ref(false)
const voiceMovementId = ref<string[]>([])
const attachableMovementsPath = computed(() =>
		`/api/v2/projects/${props.projectId}/communications/attachable-movements`)

function movementLabel(item: { id: string, dateTime?: string | null, reason?: { label?: string | null } | null }): {
	value: string
	label: string
} {
	return { value: item.id, label: `${item.reason?.label ?? '?'} (${whenText(item.dateTime)})` }
}

/**
 * An alert thread used to speak as the attached movement WHENEVER one was
 * picked — attaching an outing and signing the message were the same gesture,
 * so there was no way to say "this is me, about that outing". The voice is now
 * an explicit choice on both kinds of thread; on an alert it only offers the
 * movement voice once a movement is actually attached.
 */
const canSpeakAsMovement = computed(() => !!props.movementId || voiceMovementId.value.length > 0)

watch(canSpeakAsMovement, (available) => {
	if (!available) {
		movementVoice.value = false
	}
})

const writeBody = computed(() => (props.movementId
		? { movementId: props.movementId, onBehalfOfMovement: movementVoice.value }
		: {
			alertId: props.alertId,
			movementId: voiceMovementId.value[0] ?? null,
			onBehalfOfMovement: voiceMovementId.value.length > 0 && movementVoice.value,
		}))

/**
 * Escalation — only offered while composing a NEW message on an activity
 * outing's thread, and only to someone who may raise alerts on a project that
 * tracks them. Editing an existing message is deliberately excluded: moving a
 * message that is already in a thread is a different operation from raising an
 * incident with it.
 */
type Escalation = 'none' | 'existing' | 'new'

const escalation = ref<Escalation>('none')
const escalationAlertId = ref<string[]>([])
const escalationTitle = ref('')
const attachableAlertsPath = computed(() =>
		`/api/v2/projects/${props.projectId}/communications/attachable-alerts`)

const canEscalate = computed(() =>
		!!props.movementId
		&& !!props.activityLinked
		&& sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_OPTION_ALERT')
		&& sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_ALERT_C'))

const escalationOptions = computed(() => [
	{ value: 'none' as const, label: t('thread.escalate.none') },
	{ value: 'existing' as const, label: t('thread.escalate.existing') },
	{ value: 'new' as const, label: t('thread.escalate.new') },
])

function alertLabel(item: { id: string, title?: string | null, dateTime?: string | null }): {
	value: string
	label: string
} {
	return { value: item.id, label: `${item.title ?? '?'} (${whenText(item.dateTime)})` }
}

/**
 * Raising an alert makes the message that alert's OPENING statement, written by
 * whoever raised it — so the movement voice has nothing to say there and the
 * control is withdrawn rather than silently ignored.
 */
watch(escalation, (mode) => {
	if (mode === 'new') {
		movementVoice.value = false
	}
})

function resetEscalation(): void {
	escalation.value = 'none'
	escalationAlertId.value = []
	escalationTitle.value = ''
}

/**
 * Escalation applies to the message being written, never to one being edited.
 */
const escalating = computed(() => canEscalate.value && !editingId.value)

const canCreate = computed(() => sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_COMMUNICATION_C'))
const canUpdate = computed(() => sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_COMMUNICATION_U'))
const canDelete = computed(() => sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_COMMUNICATION_D'))
const headers = () => ({ 'x-csrf-token': sessionStore.csrf })

const comms = ref<ThreadComm[]>([])
const loading = ref(false)
const loadError = ref<unknown>('')

const editingId = ref<string | null>(null)
const draft = ref('')
const draftAt = ref<Dayjs | null>(null)
const draftAtModel = pickerModel(draftAt)
const sending = ref(false)
const composeError = ref<unknown>('')

/**
 * A movement-voiced message displays the outing as its author (Angular rule);
 * otherwise the human who wrote it.
 */
function speaksAsMovement(c: ThreadComm): boolean {
	return !!c.onBehalfOfMovement && !!c.movement
}

function authorName(c: ThreadComm): string {
	if (speaksAsMovement(c)) {
		return `${c.movement?.reason?.label ?? '?'} (${whenText(c.movement?.dateTime)})`
	}
	const u = c.creation?.user
	return u ? [u.firstName, u.lastName?.toUpperCase()].filter(Boolean).join(' ') || (u.email ?? '') : ''
}

function whenText(iso?: string | null): string {
	return iso ? d(new Date(iso), { dateStyle: 'short', timeStyle: 'short' }) : ''
}

/**
 * The movement's own timestamp is the floor of its discussion: the picker greys
 * out everything before it (and, as ever, everything after now), so the backend
 * refusal is never reached. An alert thread has no such floor — only the
 * project's window applies, which the API checks.
 */
const floorAt = computed(() => (props.movementId && props.seedDateTime ? dayjs(props.seedDateTime) : null))

const isBeforeMovement = computed(() => (value: Dayjs | null): boolean =>
		!!value && !!floorAt.value && value.isBefore(floorAt.value))

function disabledDraftDate(current: Dayjs): boolean {
	return disableFutureDate(current) || (!!floorAt.value && current.isBefore(floorAt.value, 'day'))
}

function disabledDraftTime(current: Dayjs | null) {
	const future = disableFutureTime(current)
	if (!floorAt.value || !current || !current.isSame(floorAt.value, 'day')) {
		return future
	}
	return {
		...future,
		disabledHours: () => [
			...range(0, floorAt.value!.hour()),
			...(future.disabledHours?.() ?? []),
		],
		disabledMinutes: (hour: number) => [
			...(hour === floorAt.value!.hour() ? range(0, floorAt.value!.minute()) : []),
			...(future.disabledMinutes?.(hour) ?? []),
		],
	}
}

function range(start: number, end: number): number[] {
	return Array.from({ length: Math.max(0, end - start) }, (_, index) => start + index)
}

/**
 * Oldest first, newest at the bottom — a conversation, not a feed. The server
 * already sorts by dateTime, but two messages sharing a timestamp (a burst
 * radioed in at once) came back in whatever order the page happened to hold,
 * so the thread visibly reshuffled on every refresh. The id closes the
 * ordering, which is stable across calls.
 */
function ordered(list: ThreadComm[]): ThreadComm[] {
	return [...list].sort((left, right) => {
		const delta = new Date(left.dateTime ?? 0).getTime() - new Date(right.dateTime ?? 0).getTime()
		return delta !== 0 ? delta : left.id.localeCompare(right.id)
	})
}

/**
 * Whose message it is decides where it sits and how its time reads: the
 * caller's own messages hang on the right with the time after the text, and
 * everyone else's on the left with the author above it — the arrangement that
 * makes a thread scannable without reading a single name.
 */
function isOwnMessage(c: ThreadComm): boolean {
	return !speaksAsMovement(c) && !!c.creation?.user?.email && c.creation.user.email === sessionStore.user?.email
}

function isEdited(c: ThreadComm): boolean {
	return !!c.lastEdition?.dateTime && !!c.creation?.dateTime && c.lastEdition.dateTime !== c.creation.dateTime
}

async function load(): Promise<void> {
	if (!targetId.value) {
		return
	}
	loading.value = true
	loadError.value = ''
	try {
		const p = await $fetch<{ content: ThreadComm[] }>(readPath.value, {
			query: { size: 100, sort: 'dateTime' },
		})
		comms.value = ordered(p.content ?? [])
	} catch (error) {
		loadError.value = error
	} finally {
		loading.value = false
	}
}

watch([open, targetId], ([isOpen]) => {
	if (isOpen && targetId.value) {
		editingId.value = null
		draft.value = ''
		draftAt.value = props.seedDateTime ? dayjs(props.seedDateTime) : null
		movementVoice.value = false
		voiceMovementId.value = []
		composeError.value = ''
		resetEscalation()
		load()
	}
}, { immediate: true })

function startEdit(c: ThreadComm): void {
	editingId.value = c.id
	draft.value = c.message ?? ''
	draftAt.value = c.dateTime ? dayjs(c.dateTime) : draftAt.value
	movementVoice.value = !!c.onBehalfOfMovement
	voiceMovementId.value = speaksAsMovement(c) && c.movement?.id ? [c.movement.id] : []
	composeError.value = ''
	resetEscalation()
}

function cancelEdit(): void {
	editingId.value = null
	draft.value = ''
	draftAt.value = props.seedDateTime ? dayjs(props.seedDateTime) : null
	movementVoice.value = false
	voiceMovementId.value = []
	composeError.value = ''
	resetEscalation()
}

async function submit(): Promise<void> {
	if (!draft.value.trim() || !draftAt.value || !targetId.value) {
		composeError.value = t('thread.required')
		return
	}
	if (isFutureDateTime(draftAt.value)) {
		composeError.value = t('common.notFuture')
		return
	}
	if (isBeforeMovement.value(draftAt.value)) {
		composeError.value = t('thread.beforeMovement')
		return
	}
	if (escalating.value && escalation.value === 'new' && !escalationTitle.value.trim()) {
		composeError.value = t('thread.escalate.titleRequired')
		return
	}
	if (escalating.value && escalation.value === 'existing' && escalationAlertId.value.length === 0) {
		composeError.value = t('thread.escalate.alertRequired')
		return
	}
	sending.value = true
	composeError.value = ''
	try {
		const body = { ...writeBody.value, dateTime: draftAt.value.toISOString(), message: draft.value.trim() }
		if (editingId.value) {
			await $fetch(`/api/v2/projects/${props.projectId}/communications/${editingId.value}`, {
				method: 'PATCH',
				headers: headers(),
				body,
			})
		} else if (escalating.value && escalation.value === 'new') {
			await raiseAlert(body.dateTime, body.message)
		} else {
			await $fetch(`/api/v2/projects/${props.projectId}/communications`, {
				method: 'POST',
				headers: headers(),
				body: escalating.value && escalation.value === 'existing'
						? { ...body, alertId: escalationAlertId.value[0] }
						: body,
			})
		}
		const escalated = escalating.value && escalation.value !== 'none'
		cancelEdit()
		await load()
		if (escalated) {
			emit('escalated')
		}
	} catch (error) {
		composeError.value = error
	} finally {
		sending.value = false
	}
}

/**
 * Raising the alert IS what writes the message: the creation endpoint seeds the
 * new alert's thread with it and links it to the outing in the same
 * transaction, so the message lands in both threads and nothing exists
 * half-created if the call fails.
 */
async function raiseAlert(dateTime: string, message: string): Promise<void> {
	await $fetch(`/api/v2/projects/${props.projectId}/alerts`, {
		method: 'POST',
		headers: headers(),
		body: {
			title: escalationTitle.value.trim(),
			dateTime,
			message,
			movementId: props.movementId,
		},
	})
}

function confirmDelete(c: ThreadComm): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('thread.deleteConfirm'),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: confirmButtonProps('thread-delete-confirm'),
		cancelText: t('common.cancel'),
		onOk: async () => {
			try {
				await $fetch(`/api/v2/projects/${props.projectId}/communications/${c.id}`, {
					method: 'DELETE',
					headers: headers(),
				})
				await load()
			} catch (error) {
				registryMessage.apiError(error)
			}
		},
	})
}

/**
 * A side panel needs room beside the content; a phone has none, so the same
 * drawer rises from the bottom as a sheet. One rule for the whole app
 * (useDrawerPlacement), not a media query per component.
 */
const { placement: drawerPlacement, height: drawerHeight } = useDrawerPlacement()
</script>

<template>
	<Drawer
			:placement="drawerPlacement"
			:height="drawerHeight"
			:open="open"
			:title="t('thread.title')"
			width="440"
			@close="open = false"
	>
		<!-- Testid lives on this wrapper: AntD Drawer (like DatePicker) drops
         data-testid — it never reaches the DOM. -->
		<Space
				direction="vertical"
				size="middle"
				style="width: 100%"
				:data-testid="movementId ? 'movement-thread-drawer' : 'alert-thread-drawer'"
		>
			<ApiErrorAlert
					v-if="loadError"
					:error="loadError"
			/>
			<p
					v-else-if="loading"
					aria-live="polite"
			>
				{{ t('thread.loading') }}
			</p>
			<template v-else>
				<Empty
						v-if="comms.length === 0"
						:image="Empty.PRESENTED_IMAGE_SIMPLE"
						:description="t('thread.empty')"
				/>
				<ul
						v-else
						class="thread"
						:data-testid="movementId ? 'movement-thread-list' : 'alert-thread-list'"
				>
					<li
							v-for="c in comms"
							:key="c.id"
							class="thread__item"
							:class="{ 'thread__item--own': isOwnMessage(c) }"
					>
						<div
								class="thread__bubble"
								:class="{
									'thread__bubble--own': isOwnMessage(c),
									'thread__bubble--movement': speaksAsMovement(c),
								}"
						>
							<span
									v-if="!isOwnMessage(c)"
									class="thread__author"
									:class="{ 'thread__author--movement': speaksAsMovement(c) }"
							>
								<span
										v-if="speaksAsMovement(c)"
										aria-hidden="true"
								>📻 </span>{{ authorName(c) }}</span>
							<p class="thread__message">
								{{ c.message }}
							</p>
							<span class="thread__meta">
								<time :datetime="c.dateTime ?? undefined">{{ whenText(c.dateTime) }}</time>
								<Tag
										v-if="isEdited(c)"
										:color="STATUS_COLOR.neutral"
								>
									{{ t('thread.edited') }}
								</Tag>
							</span>
						</div>
						<Space
								v-if="canUpdate || canDelete"
								size="small"
								class="thread__actions"
						>
							<Button
									v-if="canUpdate"
									size="small"
									type="link"
									:data-testid="`thread-edit-${c.id}`"
									@click="startEdit(c)"
							>
								{{ t('common.edit') }}
							</Button>
							<Button
									v-if="canDelete"
									size="small"
									type="link"
									danger
									:data-testid="`thread-delete-${c.id}`"
									@click="confirmDelete(c)"
							>
								{{ t('common.delete') }}
							</Button>
						</Space>
					</li>
				</ul>
			</template>
		</Space>

		<template #footer>
			<div
					v-if="canCreate || editingId"
					class="compose"
			>
				<div v-if="alertId">
					<label for="thread-voice-movement">{{ t('thread.voice.attachMovement') }}</label>
					<ProjectEligibilityPicker
							id="thread-voice-movement"
							v-model="voiceMovementId"
							data-testid="thread-voice-movement"
							:fetch-path="attachableMovementsPath"
							:map-item="movementLabel"
							:multiple="false"
							:placeholder="t('thread.voice.attachMovementPlaceholder')"
					/>
				</div>
				<div v-if="escalating">
					<span
							id="thread-escalate-label"
							class="compose__voice-label"
					>{{ t('thread.escalate.label') }}</span>
					<RadioGroup
							v-model:value="escalation"
							class="compose__voice"
							data-testid="thread-escalate"
							:options="escalationOptions"
							aria-labelledby="thread-escalate-label"
					/>
				</div>
				<div v-if="escalating && escalation === 'existing'">
					<label for="thread-escalate-alert">{{ t('thread.escalate.pickAlert') }}</label>
					<ProjectEligibilityPicker
							id="thread-escalate-alert"
							v-model="escalationAlertId"
							data-testid="thread-escalate-alert"
							:fetch-path="attachableAlertsPath"
							:map-item="alertLabel"
							:multiple="false"
							:placeholder="t('thread.escalate.pickAlertPlaceholder')"
					/>
				</div>
				<div v-if="escalating && escalation === 'new'">
					<label for="thread-escalate-title">{{ t('thread.escalate.alertTitle') }}</label>
					<Input
							id="thread-escalate-title"
							v-model:value="escalationTitle"
							data-testid="thread-escalate-title"
							:maxlength="FIELD_LIMIT.alertTitle"
							:placeholder="t('thread.escalate.alertTitlePlaceholder')"
					/>
				</div>
				<div v-if="canSpeakAsMovement && !(escalating && escalation === 'new')">
					<span
							id="thread-voice-label"
							class="compose__voice-label"
					>{{ t('thread.voice.label') }}</span>
					<RadioGroup
							v-model:value="movementVoice"
							class="compose__voice"
							data-testid="thread-voice"
							:options="[
								{ value: false, label: t('thread.voice.own') },
								{ value: true, label: t('thread.voice.movement') },
							]"
							aria-labelledby="thread-voice-label"
					/>
				</div>
				<label
						for="thread-message"
						class="sr-only"
				>{{ editingId ? t('thread.editing') : t('thread.compose') }}</label>
				<Textarea
						id="thread-message"
						v-model:value="draft"
						data-testid="thread-message"
						:rows="3"
						:placeholder="t('thread.placeholder')"
						:maxlength="FIELD_LIMIT.communicationMessage"
						show-count
				/>
				<div
						class="compose__at"
						data-testid="thread-datetime"
				>
					<label
							for="thread-at"
							class="sr-only"
					>{{ t('thread.at') }}</label>
					<DatePicker
							id="thread-at"
							v-model:value="draftAtModel"
							show-time
							style="width: 100%"
							:disabled-date="disabledDraftDate"
							:disabled-time="disabledDraftTime"
					/>
				</div>
				<ApiErrorAlert
						v-if="composeError"
						:error="composeError"
				/>
				<Space style="width: 100%; justify-content: flex-end">
					<Button
							v-if="editingId"
							data-testid="thread-cancel"
							@click="cancelEdit"
					>
						{{ t('common.cancel') }}
					</Button>
					<Button
							type="primary"
							:loading="sending"
							data-testid="thread-send"
							@click="submit"
					>
						{{ editingId ? t('common.save') : t('thread.send') }}
					</Button>
				</Space>
			</div>
		</template>
	</Drawer>
</template>

<style scoped>
.thread {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.thread__item {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	max-width: 100%;
}

.thread__item--own {
	align-items: flex-end;
}

.thread__bubble {
	max-width: 85%;
	padding: 8px 12px;
	border-radius: 14px;
	border: 1px solid var(--hairline);
	background: var(--surface);
	border-end-start-radius: 4px;
}

.thread__bubble--own {
	background: color-mix(in srgb, var(--focus) 12%, var(--surface));
	border-color: color-mix(in srgb, var(--focus) 28%, var(--hairline));
	border-end-start-radius: 14px;
	border-end-end-radius: 4px;
}

.thread__bubble--movement {
	background: color-mix(in srgb, var(--accent) 10%, var(--surface));
}

.thread__author {
	display: block;
	font-size: 0.8rem;
	font-weight: 600;
	opacity: 0.8;
	margin-bottom: 2px;
	overflow-wrap: anywhere;
}

.thread__author--movement {
	color: var(--focus);
}

.thread__message {
	margin: 0;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}

.thread__meta {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 6px;
	margin-top: 2px;
	font-size: 0.75rem;
	opacity: 0.65;
}

.thread__actions {
	margin-top: 2px;
}

.compose {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.compose__voice-label {
	display: block;
	margin-bottom: 4px;
	font-size: 0.85rem;
	opacity: 0.75;
}

.compose__voice {
	display: flex;
	flex-wrap: wrap;
	gap: 4px 16px;
	padding: 2px 0;
}

.compose__voice :deep(.ant-radio-wrapper) {
	margin-inline-end: 0;
	padding: 2px 0;
}

.compose__at {
	width: 100%;
}
</style>

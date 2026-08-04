<script setup lang="ts">
import { useSessionStore } from '@stores/session'
import { Alert, Button, DatePicker, Drawer, Empty, Modal, RadioGroup, Space, Tag, Textarea, } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

// The discussion thread attached to a movement OR an alert — communications
// are only ever read beside the record they concern (there is no standalone
// list). Reads `/movements/{id}/communications` or `/alerts/{id}/communications`
// and composes/edits/deletes via the project communications endpoints, sending
// `movementId` or `alertId` accordingly (@AtLeastOneIsDefined). The caller
// gates opening on the matching *_COMMUNICATION_R authority; write actions
// gate on the communication C/U/D authorities here.
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
	// Seeds the composer's timestamp (usually the parent record's dateTime).
	seedDateTime?: string | null
}>()
const open = defineModel<boolean>('open', { default: false })

const { t, d } = useI18n()
const registryMessage = useRegistryMessage()
const sessionStore = useSessionStore()

const targetId = computed(() => props.movementId ?? props.alertId ?? null)
const readPath = computed(() => (props.movementId
		? `/api/v2/projects/${props.projectId}/movements/${props.movementId}/communications`
		: `/api/v2/projects/${props.projectId}/alerts/${props.alertId}/communications`))

// Movement thread: the composer chooses between "as myself" and "as the
// movement" (onBehalfOfMovement flag). Alert thread: attaching a movement
// from the attachable set (current activity outings) IS the movement voice —
// the message then also carries that movementId.
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

// The write DTO: the thread's parent plus the message's voice.
const writeBody = computed(() => (props.movementId
		? { movementId: props.movementId, onBehalfOfMovement: movementVoice.value }
		: {
			alertId: props.alertId,
			movementId: voiceMovementId.value[0] ?? null,
			onBehalfOfMovement: voiceMovementId.value.length > 0,
		}))

const canCreate = computed(() => sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_COMMUNICATION_C'))
const canUpdate = computed(() => sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_COMMUNICATION_U'))
const canDelete = computed(() => sessionStore.hasProjectAuthority(props.projectId, 'REGISTRY_PROJECT_COMMUNICATION_D'))
const headers = () => ({ 'x-csrf-token': sessionStore.csrf })

const comms = ref<ThreadComm[]>([])
const loading = ref(false)
const loadError = ref('')

const editingId = ref<string | null>(null)
const draft = ref('')
const draftAt = ref<Dayjs | null>(null)
const sending = ref(false)
const composeError = ref('')

// A movement-voiced message displays the outing as its author (Angular rule);
// otherwise the human who wrote it.
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
		comms.value = p.content ?? []
	} catch (error) {
		loadError.value = apiErrorMessage(error)
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
}

function cancelEdit(): void {
	editingId.value = null
	draft.value = ''
	draftAt.value = props.seedDateTime ? dayjs(props.seedDateTime) : null
	movementVoice.value = false
	voiceMovementId.value = []
	composeError.value = ''
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
		} else {
			await $fetch(`/api/v2/projects/${props.projectId}/communications`, {
				method: 'POST',
				headers: headers(),
				body,
			})
		}
		cancelEdit()
		await load()
	} catch (error) {
		composeError.value = apiErrorMessage(error)
	} finally {
		sending.value = false
	}
}

function confirmDelete(c: ThreadComm): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('thread.deleteConfirm'),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: { 'data-testid': 'thread-delete-confirm' },
		cancelText: t('common.cancel'),
		onOk: async () => {
			try {
				await $fetch(`/api/v2/projects/${props.projectId}/communications/${c.id}`, {
					method: 'DELETE',
					headers: headers(),
				})
				await load()
			} catch (error) {
				registryMessage.error(apiErrorMessage(error, t))
			}
		},
	})
}
</script>

<template>
	<Drawer
			:open="open"
			:title="t('thread.title')"
			width="440"
			@close="open = false"
	>
		<!-- Testid lives on this wrapper: AntD Drawer (like DatePicker) drops
         data-testid — it never reaches the DOM (ADR 021 §3 exception). -->
		<Space
				direction="vertical"
				size="middle"
				style="width: 100%"
				:data-testid="movementId ? 'movement-thread-drawer' : 'alert-thread-drawer'"
		>
			<Alert
					v-if="loadError"
					type="error"
					show-icon
					role="alert"
					:message="loadError"
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
					>
						<div class="thread__head">
							<span
									class="thread__author"
									:class="{ 'thread__author--movement': speaksAsMovement(c) }"
							>
								<span
										v-if="speaksAsMovement(c)"
										aria-hidden="true"
								>📻 </span>{{ authorName(c) }}</span>
							<span class="thread__time">{{ whenText(c.dateTime) }}</span>
							<Tag
									v-if="isEdited(c)"
									:color="STATUS_COLOR.neutral"
							>
								{{ t('thread.edited') }}
							</Tag>
						</div>
						<p class="thread__message">
							{{ c.message }}
						</p>
						<Space
								v-if="canUpdate || canDelete"
								size="small"
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

			<div
					v-if="canCreate || editingId"
					class="compose"
			>
				<div v-if="movementId">
					<span
							id="thread-voice-label"
							class="compose__voice-label"
					>{{ t('thread.voice.label') }}</span>
					<RadioGroup
							v-model:value="movementVoice"
							data-testid="thread-voice"
							:options="[
								{ value: false, label: t('thread.voice.own') },
								{ value: true, label: t('thread.voice.movement') },
							]"
							aria-labelledby="thread-voice-label"
					/>
				</div>
				<div v-else>
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
				<label for="thread-message">
					{{ editingId ? t('thread.editing') : t('thread.compose') }}
				</label>
				<Textarea
						id="thread-message"
						v-model:value="draft"
						data-testid="thread-message"
						:rows="3"
						:placeholder="t('thread.placeholder')"
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
							v-model:value="draftAt"
							show-time
							style="width: 100%"
							:disabled-date="disableFutureDate"
							:disabled-time="disableFutureTime"
					/>
				</div>
				<Alert
						v-if="composeError"
						type="error"
						show-icon
						role="alert"
						:message="composeError"
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
		</Space>
	</Drawer>
</template>

<style scoped>
.thread {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.thread__item {
	padding: 12px;
	border-radius: 12px;
	border: 1px solid var(--hairline);
	background: var(--surface);
}

.thread__head {
	display: flex;
	align-items: baseline;
	gap: 8px;
	flex-wrap: wrap;
}

.thread__author {
	font-weight: 600;
}

.thread__author--movement {
	font-style: italic;
	color: var(--accent);
}

.thread__time {
	font-size: 0.82rem;
	opacity: 0.62;
}

.thread__message {
	margin: 6px 0;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}

.compose {
	display: flex;
	flex-direction: column;
	gap: 8px;
	border-top: 1px solid var(--hairline);
	padding-top: 12px;
}
</style>

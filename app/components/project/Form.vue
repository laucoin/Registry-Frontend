<script setup lang="ts">
import { PROJECT_OPTION_DEPENDENCIES, type ProjectOption, type ProjectRowDto } from '@shared/utils/api-types'
import { FIELD_LIMIT } from '@shared/utils/field-limits'
import { useSessionStore } from '@stores/session'
import { Button, Card, DatePicker, Input, Space, Steps, Switch, Typography } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

/**
 * Shared two-step project form (Informations → Options), used for both create
 * (POST) and edit (PATCH). A11y: every field is explicitly labelled, errors are
 * announced, and option dependencies are applied automatically. Testids are
 * namespaced by mode (`project-create-*` / `project-edit-*`) so the create
 * journey keeps its selectors. Label convention (QA U7): required fields carry
 * plain labels; optional ones say so via an "(optional)" suffix.
 */
const props = defineProps<{
	mode: 'create' | 'edit'
	projectId?: string
	initial?: ProjectRowDto | null
}>()

const { t } = useI18n()
const sessionStore = useSessionStore()
const tid = (suffix: string) => `project-${props.mode}-${suffix}`

const OPTIONS: ProjectOption[] = ['VEHICLE', 'ACTIVITY', 'COMMUNICATION', 'ALERT']

const currentStep = ref(0)
const name = ref('')
const beginDate = ref<Dayjs | null>(null)
const beginTime = ref<Dayjs | null>(null)
const endDate = ref<Dayjs | null>(null)
const endTime = ref<Dayjs | null>(null)
const beginDateModel = pickerModel(beginDate)
const endDateModel = pickerModel(endDate)
const selectedOptions = ref<Set<ProjectOption>>(new Set())
const submitError = ref<unknown>('')
const submitting = ref(false)

/**
 * Prefill from an existing project (edit). Times are sliced to HH:mm:ss to drop
 * any offset before being reassembled into a Dayjs the pickers understand.
 */
function prefill(project: ProjectRowDto): void {
	name.value = project.name ?? ''
	if (project.begin?.date) {
		beginDate.value = dayjs(project.begin.date)
		beginTime.value = project.begin.time ? dayjs(`${project.begin.date}T${project.begin.time.slice(0, 8)}`) : null
	}
	if (project.end?.date) {
		endDate.value = dayjs(project.end.date)
		endTime.value = project.end.time ? dayjs(`${project.end.date}T${project.end.time.slice(0, 8)}`) : null
	}
	selectedOptions.value = new Set(
			(project.options ?? []).map(o => o.value as ProjectOption).filter(v => OPTIONS.includes(v)),
	)
}

watch(() => props.initial, value => value && prefill(value), { immediate: true })

/**
 * Validation runs LIVE: the name checks itself on every keystroke once the
 * field has been touched, so the required rule and the length ceiling are
 * visible while typing rather than after pressing Next. The input's maxlength
 * makes the ceiling unreachable in practice; the rule stays because an edited
 * project can already hold a value longer than the current limit.
 */
const nameField = useField(name, [
	rules.required(t('projects.form.nameRequired')),
	rules.maxLength(FIELD_LIMIT.projectName, limit => t('common.tooLong', { limit })),
])

/**
 * End before begin is rejected by the backend; catch the unambiguous case here
 * so the user sees it on step 1 instead of after submitting step 2. Equal
 * begin/end stays the backend's call.
 */
function datesOutOfOrder(): boolean {
	if (!beginDate.value || !endDate.value) {
		return false
	}
	const begin = beginTime.value
			? beginDate.value.hour(beginTime.value.hour()).minute(beginTime.value.minute())
			: beginDate.value.startOf('day')
	const end = endTime.value
			? endDate.value.hour(endTime.value.hour()).minute(endTime.value.minute())
			: endDate.value.startOf('day')
	return end.isBefore(begin)
}

/**
 * A time with no date is silently dropped by toDateTime(), so reject it here
 * (mirrors the v1 RegistryValidators.dateRequiredForTime()) instead of saving a
 * project without the begin/end the user typed.
 */
function timeWithoutDate(): boolean {
	return (!!beginTime.value && !beginDate.value) || (!!endTime.value && !endDate.value)
}

/**
 * The window is a CROSS-FIELD rule, so it belongs to the four pickers together
 * rather than to any one of them: it appears as soon as they are inconsistent
 * and clears the moment they are not.
 */
const datesTouched = ref(false)
const dateError = computed(() => {
	if (!datesTouched.value) {
		return ''
	}
	if (timeWithoutDate()) {
		return t('projects.form.dateRequiredForTime')
	}
	return datesOutOfOrder() ? t('projects.form.dateOrder') : ''
})

watch([beginDate, beginTime, endDate, endTime], () => {
	datesTouched.value = true
})

function nextStep(): void {
	nameField.touch()
	datesTouched.value = true
	if (!nameField.valid.value || timeWithoutDate() || datesOutOfOrder()) {
		return
	}
	currentStep.value = 1
}

/**
 * Going back to step 1 discards the stale submit failure — the user is about
 * to change inputs, and a lingering error banner reads as "still broken".
 */
function backToInformations(): void {
	submitError.value = ''
	currentStep.value = 0
}

function toggleOption(option: ProjectOption, enabled: boolean): void {
	const next = new Set(selectedOptions.value)
	if (enabled) {
		next.add(option)
		PROJECT_OPTION_DEPENDENCIES[option].forEach(required => next.add(required))
	} else {
		next.delete(option)
		OPTIONS.filter(other => PROJECT_OPTION_DEPENDENCIES[other].includes(option))
				.forEach(dependent => next.delete(dependent))
	}
	selectedOptions.value = next
}

const allSelected = computed(() => OPTIONS.every(option => selectedOptions.value.has(option)))

/**
 * The control names what pressing it DOES, not what it did: once everything is
 * on, the only useful action left is clearing the list.
 */
const selectAllLabel = computed(() =>
	(allSelected.value ? t('projects.form.deselectAll') : t('projects.form.selectAll')))

function toggleAll(enabled: boolean): void {
	selectedOptions.value = enabled ? new Set(OPTIONS) : new Set()
}

function toDateTime(date: Dayjs | null, time: Dayjs | null): { date: string, time?: string } | null {
	if (!date) {
		return null
	}
	return {
		date: date.format('YYYY-MM-DD'),
		...(time ? { time: time.format('HH:mm:ssZ') } : {}),
	}
}

/**
 * Both branches re-derive the session profile, for the same reason from two
 * directions: the project OPTIONS are carried as project-scoped authorities
 * ({projectId}_REGISTRY_PROJECT_OPTION_*), and every option-gated surface —
 * the dashboard panels, the shell's tabs, the settings menu — reads them from
 * there. Creating grants a fresh admin profile; editing can add or REVOKE an
 * option, and without the refresh a module just switched off keeps its block on
 * the dashboard, which then answers the block's own fetch with a 403.
 *
 * The project payloads are invalidated alongside it so the name, the window and
 * the option tags repaint from the saved version rather than the cached one.
 */
async function submit(): Promise<void> {
	submitting.value = true
	submitError.value = ''
	const body = {
		name: name.value.trim(),
		begin: toDateTime(beginDate.value, beginTime.value),
		end: toDateTime(endDate.value, endTime.value),
		options: [...selectedOptions.value],
	}
	try {
		if (props.mode === 'edit') {
			await $fetch(`/api/v2/projects/${props.projectId}`, {
				method: 'PATCH',
				headers: { 'x-csrf-token': sessionStore.csrf },
				body,
			})
			await sessionStore.refreshProfile()
			await refreshNuxtData([
				`project-${props.projectId}`,
				`project-edit-${props.projectId}`,
				'projects-list',
			])
			await navigateTo(`/projects/${props.projectId}`)
		} else {
			const created = await $fetch<{ id: string }>('/api/v2/projects', {
				method: 'POST',
				headers: { 'x-csrf-token': sessionStore.csrf },
				body,
			})
			await sessionStore.refreshProfile()
			await navigateTo(`/projects/${created.id}`)
		}
	} catch (error) {
		submitError.value = error
	} finally {
		submitting.value = false
	}
}
</script>

<template>
	<Space
			direction="vertical"
			size="large"
			style="width: 100%"
	>
		<Typography>
			<h1>{{ mode === 'edit' ? $t('projects.editTitle') : $t('projects.createTitle') }}</h1>
		</Typography>

		<!-- :key forces a fresh Steps instance per step: antd caches the finish
         check-icon vnode in a computed, so re-mounting it after a back-nav
         reuses a vnode whose el is a detached node — Vue then takes the
         hydration path and crashes (nodeType of null), wedging the wizard. -->
		<Steps
				:key="currentStep"
				:current="currentStep"
				:items="[
					{ title: $t('projects.step.informations') },
					{ title: $t('projects.step.options') },
				]"
		/>

		<!-- v-if (not v-show): re-patching the hidden card after a back-nav hits a
         Vue 3.5 async-hydration crash (nodeType of null) that wedges the whole
         wizard; field state lives in refs so remounting loses nothing. -->
		<Card v-if="currentStep === 0">
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<div>
					<label for="project-name">
						{{ $t('projects.form.name') }}
					</label>
					<!-- show-count + maxlength: the ceiling is the column width, so the
               field simply stops accepting characters and says how much room
               is left, instead of letting the API refuse the save. -->
					<Input
							id="project-name"
							v-model:value="name"
							:data-testid="tid('name')"
							:placeholder="$t('projects.form.namePlaceholder')"
							:status="nameField.visibleError.value ? 'error' : undefined"
							:maxlength="FIELD_LIMIT.projectName"
							show-count
							aria-required="true"
							:aria-invalid="Boolean(nameField.visibleError.value)"
							:aria-describedby="nameField.visibleError.value ? 'project-name-error' : undefined"
							@blur="nameField.touch()"
					/>
					<p
							v-if="nameField.visibleError.value"
							id="project-name-error"
							role="alert"
							class="field-error"
					>
						{{ nameField.visibleError.value }}
					</p>
				</div>

				<div>
					<div class="date-grid">
						<div :data-testid="tid('begin-date')">
							<label
									:for="tid('begin-date-input')"
									class="sr-only"
							>{{ $t('projects.form.beginDate') }}</label>
							<DatePicker
									:id="tid('begin-date-input')"
									v-model:value="beginDateModel"
									style="width: 100%"
									:placeholder="$t('projects.form.beginDate')"
							/>
						</div>
						<div>
							<label
									:for="tid('begin-time-input')"
									class="sr-only"
							>{{ $t('projects.form.beginTime') }}</label>
							<TimeField
									:id="tid('begin-time-input')"
									v-model="beginTime"
									:testid="tid('begin-time')"
									:aria-label="$t('projects.form.beginTime')"
							/>
						</div>
						<div :data-testid="tid('end-date')">
							<label
									:for="tid('end-date-input')"
									class="sr-only"
							>{{ $t('projects.form.endDate') }}</label>
							<DatePicker
									:id="tid('end-date-input')"
									v-model:value="endDateModel"
									style="width: 100%"
									:placeholder="$t('projects.form.endDate')"
							/>
						</div>
						<div>
							<label
									:for="tid('end-time-input')"
									class="sr-only"
							>{{ $t('projects.form.endTime') }}</label>
							<TimeField
									:id="tid('end-time-input')"
									v-model="endTime"
									:testid="tid('end-time')"
									:aria-label="$t('projects.form.endTime')"
							/>
						</div>
					</div>
					<p
							v-if="dateError"
							role="alert"
							class="field-error"
							:data-testid="tid('date-error')"
					>
						{{ dateError }}
					</p>
				</div>

				<Space style="width: 100%; justify-content: space-between">
					<NuxtLink :to="mode === 'edit' ? `/projects/${projectId}` : '/projects'">
						<Button :data-testid="tid('cancel')">
							{{ $t('common.cancel') }}
						</Button>
					</NuxtLink>
					<Button
							type="primary"
							:data-testid="tid('next')"
							@click="nextStep"
					>
						{{ $t('common.next') }}
					</Button>
				</Space>
			</Space>
		</Card>

		<Card v-else>
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<Space style="width: 100%; justify-content: flex-end">
					<label for="project-options-all">{{ selectAllLabel }}</label>
					<Switch
							id="project-options-all"
							:data-testid="tid('options-all')"
							:checked="allSelected"
							@change="checked => toggleAll(Boolean(checked))"
					/>
				</Space>

				<Space
						v-for="option in OPTIONS"
						:key="option"
						style="width: 100%; justify-content: space-between"
				>
					<label :for="`project-option-${option}`">{{ $t(`projects.option.${option}`) }}</label>
					<Switch
							:id="`project-option-${option}`"
							:data-testid="tid(`option-${option.toLowerCase()}`)"
							:checked="selectedOptions.has(option)"
							@change="checked => toggleOption(option, Boolean(checked))"
					/>
				</Space>

				<ApiErrorAlert
						v-if="submitError"
						:error="submitError"
				/>

				<Space style="width: 100%; justify-content: space-between">
					<Button
							:data-testid="tid('back')"
							@click="backToInformations"
					>
						{{ $t('common.back') }}
					</Button>
					<Button
							type="primary"
							:data-testid="tid('submit')"
							:loading="submitting"
							@click="submit"
					>
						{{ mode === 'edit' ? $t('common.save') : $t('common.create') }}
					</Button>
				</Space>
			</Space>
		</Card>
	</Space>
</template>

<style scoped>
.field-error {
	color: var(--danger-text, #d4380d);
	margin: 4px 0 0;
}

.date-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
}

@media (max-width: 480px) {
	.date-grid {
		grid-template-columns: 1fr;
	}
}
</style>

<script setup lang="ts">
import { PROJECT_OPTION_DEPENDENCIES, type ProjectOption, type ProjectRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Alert, Button, Card, DatePicker, Input, Space, Steps, Switch, TimePicker, Typography } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

// Shared two-step project form (Informations → Options), used for both create
// (POST) and edit (PATCH). A11y: every field is explicitly labelled, errors are
// announced, and option dependencies are applied automatically. Testids are
// namespaced by mode (`project-create-*` / `project-edit-*`) so the create
// journey keeps its selectors. Label convention (QA U7): required fields carry
// plain labels; optional ones say so via an "(optional)" suffix.
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
const nameError = ref('')
const dateError = ref('')
const beginDate = ref<Dayjs | null>(null)
const beginTime = ref<Dayjs | null>(null)
const endDate = ref<Dayjs | null>(null)
const endTime = ref<Dayjs | null>(null)
const selectedOptions = ref<Set<ProjectOption>>(new Set())
const submitError = ref('')
const submitting = ref(false)

// Prefill from an existing project (edit). Times are sliced to HH:mm:ss to drop
// any offset before being reassembled into a Dayjs the pickers understand.
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

// End before begin is rejected by the backend; catch the unambiguous case here
// so the user sees it on step 1 instead of after submitting step 2. Equal
// begin/end stays the backend's call.
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

// A time with no date is silently dropped by toDateTime(), so reject it here
// (mirrors the v1 RegistryValidators.dateRequiredForTime()) instead of saving a
// project without the begin/end the user typed.
function timeWithoutDate(): boolean {
	return (!!beginTime.value && !beginDate.value) || (!!endTime.value && !endDate.value)
}

function nextStep(): void {
	if (!name.value.trim()) {
		nameError.value = t('projects.form.nameRequired')
		return
	}
	nameError.value = ''
	if (timeWithoutDate()) {
		dateError.value = t('projects.form.dateRequiredForTime')
		return
	}
	if (datesOutOfOrder()) {
		dateError.value = t('projects.form.dateOrder')
		return
	}
	dateError.value = ''
	currentStep.value = 1
}

// Going back to step 1 discards the stale submit failure — the user is about
// to change inputs, and a lingering error banner reads as "still broken".
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

// Creating a project grants the creator an admin profile on it → new
// project-scoped authorities; a successful create therefore refreshes the
// session profile so the list/shell see them.
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
			await navigateTo(`/projects/${props.projectId}`)
		} else {
			await $fetch('/api/v2/projects', {
				method: 'POST',
				headers: { 'x-csrf-token': sessionStore.csrf },
				body,
			})
			await sessionStore.refreshProfile()
			await navigateTo('/projects')
		}
	} catch (error) {
		submitError.value = apiErrorMessage(error)
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
					<Input
							id="project-name"
							v-model:value="name"
							:data-testid="tid('name')"
							:placeholder="$t('projects.form.namePlaceholder')"
							:status="nameError ? 'error' : undefined"
							aria-required="true"
							:aria-invalid="Boolean(nameError)"
							:aria-describedby="nameError ? 'project-name-error' : undefined"
					/>
					<p
							v-if="nameError"
							id="project-name-error"
							role="alert"
							style="color: #d4380d; margin: 4px 0 0"
					>
						{{ nameError }}
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
									v-model:value="beginDate"
									style="width: 100%"
									:placeholder="$t('projects.form.beginDate')"
							/>
						</div>
						<div :data-testid="tid('begin-time')">
							<label
									:for="tid('begin-time-input')"
									class="sr-only"
							>{{ $t('projects.form.beginTime') }}</label>
							<TimePicker
									:id="tid('begin-time-input')"
									v-model:value="beginTime"
									format="HH:mm"
									style="width: 100%"
									:placeholder="$t('projects.form.beginTime')"
							/>
						</div>
						<div :data-testid="tid('end-date')">
							<label
									:for="tid('end-date-input')"
									class="sr-only"
							>{{ $t('projects.form.endDate') }}</label>
							<DatePicker
									:id="tid('end-date-input')"
									v-model:value="endDate"
									style="width: 100%"
									:placeholder="$t('projects.form.endDate')"
							/>
						</div>
						<div :data-testid="tid('end-time')">
							<label
									:for="tid('end-time-input')"
									class="sr-only"
							>{{ $t('projects.form.endTime') }}</label>
							<TimePicker
									:id="tid('end-time-input')"
									v-model:value="endTime"
									format="HH:mm"
									style="width: 100%"
									:placeholder="$t('projects.form.endTime')"
							/>
						</div>
					</div>
					<p
							v-if="dateError"
							role="alert"
							style="color: #d4380d; margin: 4px 0 0"
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
					<label for="project-options-all">{{ $t('projects.form.selectAll') }}</label>
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

				<Alert
						v-if="submitError"
						type="error"
						show-icon
						role="alert"
						:message="submitError"
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

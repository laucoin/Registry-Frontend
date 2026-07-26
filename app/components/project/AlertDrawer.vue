<script setup lang="ts">
import type { AlertRowDto } from '@shared/utils/api-types'
import { FIELD_LIMIT } from '@shared/utils/field-limits'
import { Button, DatePicker, Drawer, Input, Space, Textarea } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

/**
 * Raising an alert, and editing one that is already open.
 *
 * Like the movement form, it is a component rather than a section of the alerts
 * page: an incident is reported from wherever the operator notices it, and
 * making them navigate to a list first is time spent at exactly the wrong
 * moment. The page passes `editing` to reuse it as an edit form; every other
 * caller opens it empty.
 */
const props = defineProps<{ projectId: string, editing?: AlertRowDto | null }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ saved: [] }>()

const { t } = useI18n()

const write = useDomainWrite({
	projectId: () => props.projectId,
	basePath: () => `/api/v2/projects/${props.projectId}/alerts`,
	fetchKey: () => `alerts-${props.projectId}`,
	permissionPrefix: 'REGISTRY_PROJECT_ALERT',
})

const editingId = ref<string | null>(null)
/**
 * The alert edit DTO is title/dateTime/status (no message — the message belongs
 * to the initial communication). Round-trip the status so a title/date edit
 * doesn't change the alert's state.
 */
const editStatus = ref<string | null>(null)
const title = ref('')
const dateTime = ref<Dayjs | null>(null)
const dateTimeModel = pickerModel(dateTime)
const message = ref('')
const formError = ref<unknown>('')
const submitting = ref(false)

const drawerTitle = computed(() => (editingId.value ? t('alerts.edit') : t('alerts.add')))

/**
 * The fields are filled from `editing` at the moment the panel opens, not by
 * watching the prop: a caller that clears its selection while the drawer is
 * closing would otherwise blank the form under the closing animation.
 */
watch(open, (isOpen) => {
	if (!isOpen) {
		return
	}
	const alert = props.editing
	editingId.value = alert?.id ?? null
	editStatus.value = alert?.status?.value ?? null
	title.value = alert?.title ?? ''
	dateTime.value = alert?.dateTime ? dayjs(alert.dateTime) : null
	message.value = ''
	formError.value = ''
})

/**
 * The dateTime must fall within the project's date range (backend rule).
 */
async function submit(): Promise<void> {
	if (!title.value.trim() || !dateTime.value) {
		formError.value = t('alerts.form.required')
		return
	}
	if (isFutureDateTime(dateTime.value)) {
		formError.value = t('common.notFuture')
		return
	}
	submitting.value = true
	formError.value = ''
	try {
		if (editingId.value) {
			await write.update(editingId.value, {
				title: title.value.trim(),
				dateTime: dateTime.value.toISOString(),
				status: editStatus.value,
			})
		} else {
			await write.create({
				title: title.value.trim(),
				dateTime: dateTime.value.toISOString(),
				message: message.value.trim() || null,
			})
		}
		open.value = false
		emit('saved')
	} catch (error) {
		formError.value = error
	} finally {
		submitting.value = false
	}
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
			:title="drawerTitle"
			width="400"
			@close="open = false"
	>
		<Space
				direction="vertical"
				size="middle"
				style="width: 100%"
		>
			<div>
				<label for="alert-title">{{ t('alerts.form.title') }}</label>
				<Input
						id="alert-title"
						v-model:value="title"
						data-testid="alert-form-title"
						aria-required="true"
						:maxlength="FIELD_LIMIT.alertTitle"
						show-count
				/>
			</div>
			<div data-testid="alert-form-datetime">
				<label for="alert-datetime">{{ t('alerts.form.dateTime') }}</label>
				<DatePicker
						id="alert-datetime"
						v-model:value="dateTimeModel"
						show-time
						style="width: 100%"
						:disabled-date="disableFutureDate"
						:disabled-time="disableFutureTime"
				/>
			</div>
			<div v-if="!editingId">
				<label for="alert-message">{{ t('alerts.form.message') }}</label>
				<Textarea
						id="alert-message"
						v-model:value="message"
						data-testid="alert-form-message"
						:rows="3"
				/>
			</div>
			<ApiErrorAlert
					v-if="formError"
					:error="formError"
			/>
			<Space style="width: 100%; justify-content: flex-end">
				<Button
						data-testid="alert-form-cancel"
						@click="open = false"
				>
					{{ t('common.cancel') }}
				</Button>
				<Button
						type="primary"
						:loading="submitting"
						data-testid="alert-form-submit"
						@click="submit"
				>
					{{ editingId ? t('common.save') : t('common.create') }}
				</Button>
			</Space>
		</Space>
	</Drawer>
</template>

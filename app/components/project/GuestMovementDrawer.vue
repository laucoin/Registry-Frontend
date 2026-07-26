<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import type { AssignableParticipantDto, MovementReasonOptionDto } from '@shared/utils/api-types'
import { FIELD_LIMIT } from '@shared/utils/field-limits'
import { useSessionStore } from '@stores/session'
import { Button, DatePicker, Drawer, Input, RadioGroup, Select, Space } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

/**
 * The guest movement flow (POST …/movements/guests). It is deliberately
 * separate from the registered-participant drawer because the backend content
 * rules invert by direction (@MovementGuestContent):
 * IN  → record NEW ad-hoc guests arriving (`guests`: firstName/lastName/
 * birthday); no existing content. A reason is required (@MovementReason
 * for GUEST: a null reason is valid only for OUT).
 * OUT → existing guests leaving (`content`: participant ids from the GUEST
 * eligibility set); no new guests. Reason optional.
 * Guests carry no vehicle/pool/group/activity — none exist on the DTO.
 */
const props = defineProps<{ projectId: string, basePath: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ created: [] }>()

const { t } = useI18n()
const sessionStore = useSessionStore()

interface GuestRow {
	firstName: string
	lastName: string
	birthday: Dayjs | null
}

const emptyGuest = (): GuestRow => ({ firstName: '', lastName: '', birthday: null })

const type = ref<'IN' | 'OUT'>('IN')
const dateTime = ref<Dayjs | null>(null)
const dateTimeModel = pickerModel(dateTime)
const reason = ref<string | undefined>(undefined)
const reasonOptions = ref<{ value: string, label: string }[]>([])
const guests = ref<GuestRow[]>([emptyGuest()])
const existingGuestIds = ref<string[]>([])
const formError = ref<unknown>('')
const submitting = ref(false)

const typeOptions = computed(() => ([
	{ value: 'IN', label: t('movements.type.in') },
	{ value: 'OUT', label: t('movements.type.out') },
]))

/**
 * Guests can't be attached to an activity (no activityId on the DTO), so only
 * real reasons (kind REASON) apply — drop the activities the endpoint merges in.
 */
async function loadReasons(): Promise<void> {
	reason.value = undefined
	const raw = await $fetch<MovementReasonOptionDto[]>(`${props.basePath}/reasons`, {
		query: { type: type.value, contentType: 'GUEST' },
	})
	reasonOptions.value = raw.filter(o => o.kind === 'REASON').map(o => ({ value: o.value, label: o.label }))
}

watch(type, loadReasons)

/**
 * Guests are the mirror of registered participants: every guest reason is an
 * ENTRY (emergency, logistics, partner animation, visit), so an arrival must
 * carry one and a departure has none to offer — the field is not merely
 * optional there, it does not apply and is not shown.
 */
const showReason = computed(() => reasonApplies(type.value, 'GUEST'))
const isReasonRequired = computed(() => reasonRequired(type.value, 'GUEST'))

const eligibleGuestPath = computed(() =>
		`${props.basePath}/eligible-participants-and-groups?contentType=GUEST`)

function extractGuests(raw: unknown): AssignableParticipantDto[] {
	return (raw as { participants?: AssignableParticipantDto[] }).participants ?? []
}

function guestLabel(item: AssignableParticipantDto): { value: string, label: string } {
	return { value: item.id, label: [item.firstName, item.lastName?.toUpperCase()].filter(Boolean).join(' ') }
}

function addGuestRow(): void {
	guests.value.push(emptyGuest())
}

function removeGuestRow(index: number): void {
	guests.value.splice(index, 1)
	if (guests.value.length === 0) {
		guests.value.push(emptyGuest())
	}
}

watch(open, async (isOpen) => {
	if (!isOpen) {
		return
	}
	type.value = 'IN'
	dateTime.value = dayjs()
	guests.value = [emptyGuest()]
	existingGuestIds.value = []
	formError.value = ''
	await loadReasons()
})

async function submit(): Promise<void> {
	if (!dateTime.value || (isReasonRequired.value && !reason.value)) {
		formError.value = t('movements.guest.required')
		return
	}
	if (isFutureDateTime(dateTime.value)) {
		formError.value = t('common.notFuture')
		return
	}
	let body: Record<string, unknown>
	if (type.value === 'IN') {
		const complete = guests.value.filter(g => g.firstName.trim() && g.lastName.trim() && g.birthday)
		if (complete.length === 0) {
			formError.value = t('movements.guest.guestsRequired')
			return
		}
		body = {
			type: 'IN',
			dateTime: dateTime.value.toISOString(),
			reason: reason.value ?? null,
			guests: complete.map(g => ({
				firstName: g.firstName.trim(),
				lastName: g.lastName.trim(),
				birthday: g.birthday!.format('YYYY-MM-DD'),
			})),
		}
	} else {
		if (existingGuestIds.value.length === 0) {
			formError.value = t('movements.guest.contentRequired')
			return
		}
		body = {
			type: 'OUT',
			dateTime: dateTime.value.toISOString(),
			reason: null,
			content: existingGuestIds.value.map(id => ({ participantId: id })),
		}
	}
	submitting.value = true
	formError.value = ''
	try {
		await $fetch(`${props.basePath}/guests`, {
			method: 'POST',
			headers: { 'x-csrf-token': sessionStore.csrf },
			body,
		})
		open.value = false
		emit('created')
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
			:title="t('movements.guest.add')"
			width="440"
			@close="open = false"
	>
		<Space
				direction="vertical"
				size="middle"
				style="width: 100%"
		>
			<div>
				<span
						id="guest-type-label"
						class="field-label"
				>{{ t('movements.form.type') }}</span>
				<RadioGroup
						v-model:value="type"
						:options="typeOptions"
						data-testid="movement-guest-form-type"
						aria-labelledby="guest-type-label"
				/>
			</div>
			<div data-testid="movement-guest-form-datetime">
				<label for="guest-datetime">{{ t('movements.form.dateTime') }}</label>
				<DatePicker
						id="guest-datetime"
						v-model:value="dateTimeModel"
						show-time
						style="width: 100%"
						:disabled-date="disableFutureDate"
						:disabled-time="disableFutureTime"
				/>
			</div>
			<div v-if="showReason && reasonOptions.length > 0">
				<label for="guest-reason">{{ t('movements.form.motive') }}</label>
				<Select
						id="guest-reason"
						v-model:value="reason"
						:options="reasonOptions"
						:placeholder="t('movements.form.motivePlaceholder')"
						:aria-required="isReasonRequired"
						data-testid="movement-guest-form-reason"
						allow-clear
						style="width: 100%"
				/>
			</div>

			<div v-if="type === 'IN'">
				<span class="field-label">{{ t('movements.guest.people') }}</span>
				<div
						v-for="(guest, index) in guests"
						:key="index"
						class="guest-row"
				>
					<Input
							v-model:value="guest.firstName"
							:placeholder="t('participants.form.firstName')"
							:aria-label="t('participants.form.firstName')"
							:data-testid="`movement-guest-${index}-firstname`"
							:maxlength="FIELD_LIMIT.participantFirstName"
							style="flex: 1 1 6rem"
					/>
					<Input
							v-model:value="guest.lastName"
							:placeholder="t('participants.form.lastName')"
							:aria-label="t('participants.form.lastName')"
							:data-testid="`movement-guest-${index}-lastname`"
							:maxlength="FIELD_LIMIT.participantLastName"
							style="flex: 1 1 6rem"
					/>
					<div
							:data-testid="`movement-guest-${index}-birthday`"
							style="flex: 1 1 8rem"
					>
						<!-- AntD's Picker drops aria-label; only `id` reaches the inner
						     input, so the name has to come from a <label for>. Numbered
						     per row so each guest's field is distinguishable. -->
						<label
								:for="`guest-${index}-birthday`"
								class="sr-only"
						>{{ t('movements.guest.birthdayFor', { position: index + 1 }) }}</label>
						<DatePicker
								:id="`guest-${index}-birthday`"
								:value="guest.birthday ?? undefined"
								:placeholder="t('participants.form.birthday')"
								style="width: 100%"
								@update:value="value => guest.birthday = toPickerDate(value)"
						/>
					</div>
					<Button
							danger
							:aria-label="t('common.remove')"
							:data-testid="`movement-guest-${index}-remove`"
							@click="removeGuestRow(index)"
					>
						✕
					</Button>
				</div>
				<Button
						data-testid="movement-guest-add"
						@click="addGuestRow"
				>
					<template #icon>
						<PlusOutlined/>
					</template>
					{{ t('movements.guest.addPerson') }}
				</Button>
			</div>
			<div v-else>
				<label for="guest-existing">{{ t('movements.guest.existing') }}</label>
				<ProjectEligibilityPicker
						id="guest-existing"
						v-model="existingGuestIds"
						:fetch-path="eligibleGuestPath"
						:map-item="guestLabel"
						:extract="extractGuests"
						:placeholder="t('movements.guest.existingPlaceholder')"
						data-testid="movement-guest-form-existing"
				/>
			</div>

			<ApiErrorAlert
					v-if="formError"
					:error="formError"
			/>
			<Space style="width: 100%; justify-content: flex-end">
				<Button
						data-testid="movement-guest-form-cancel"
						@click="open = false"
				>
					{{ t('common.cancel') }}
				</Button>
				<Button
						type="primary"
						:loading="submitting"
						data-testid="movement-guest-form-submit"
						@click="submit"
				>
					{{ t('common.create') }}
				</Button>
			</Space>
		</Space>
	</Drawer>
</template>

<style scoped>
.field-label {
	display: block;
}

.guest-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	margin-bottom: 8px;
}
</style>

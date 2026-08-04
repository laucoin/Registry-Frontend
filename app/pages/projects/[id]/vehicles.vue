<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import type { VehicleRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { Alert, Button, Drawer, Input, ListItem, Modal, Space, Tag } from 'ant-design-vue'

definePageMeta({ middleware: 'project-authority' })

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { t } = useI18n()

const listKey = computed(() => `vehicles-${projectId.value}`)
const write = useDomainWrite({
	projectId: () => projectId.value,
	basePath: () => `/api/v2/projects/${projectId.value}/vehicles`,
	fetchKey: () => listKey.value,
	permissionPrefix: 'REGISTRY_PROJECT_VEHICLE',
})

function label(vehicle: VehicleRowDto): string {
	return [vehicle.brand, vehicle.model].filter(Boolean).join(' ')
}

const filterStatus = ref<string | boolean>()
const filterVisible = ref<string | boolean>()
const extraQuery = computed(() => ({ status: filterStatus.value, visible: filterVisible.value }))
const statusOptions = computed(() => (['IN', 'OUT', 'UNAVAILABLE']).map(v => ({
	value: v,
	label: t(`filters.presence.${v}`),
})))
const visibilityOptions = computed(() => [{ value: true, label: t('filters.visible') }, {
	value: false,
	label: t('filters.hidden'),
}])

// Movement history (Phase H).
const sessionStore = useSessionStore()
const canHistory = computed(() => sessionStore.hasProjectAuthority(projectId.value, 'REGISTRY_PROJECT_VEHICLE_HISTORY_R'))
const historyOpen = ref(false)
const historyPath = ref<string | null>(null)
const historyTitle = ref('')

function openHistory(v: VehicleRowDto): void {
	historyPath.value = `/api/v2/projects/${projectId.value}/vehicles/${v.id}/movements`
	historyTitle.value = t('history.title', { name: label(v) || v.licensePlate })
	historyOpen.value = true
}

type CustomDt = { date?: string | null, time?: string | null } | null
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const editLoading = ref(false)
const licensePlate = ref('')
const brand = ref('')
const model = ref('')
const startAvailability = ref<CustomDt>(null)
const endAvailability = ref<CustomDt>(null)
const formError = ref('')
const submitting = ref(false)

const drawerTitle = computed(() => (editingId.value ? t('vehicles.edit') : t('vehicles.add')))

function resetForm(): void {
	licensePlate.value = ''
	brand.value = ''
	model.value = ''
	startAvailability.value = null
	endAvailability.value = null
	formError.value = ''
}

function openDrawer(): void {
	editingId.value = null
	resetForm()
	drawerOpen.value = true
}

async function openEdit(v: VehicleRowDto): Promise<void> {
	editingId.value = v.id
	resetForm()
	licensePlate.value = v.licensePlate ?? ''
	brand.value = v.brand ?? ''
	model.value = v.model ?? ''
	drawerOpen.value = true
	editLoading.value = true
	try {
		const full = await $fetch<{
			licensePlate?: string | null
			brand?: string | null
			model?: string | null
			startAvailability?: CustomDt
			endAvailability?: CustomDt
		}>(`/api/v2/projects/${projectId.value}/vehicles/${v.id}`)
		licensePlate.value = full.licensePlate ?? licensePlate.value
		brand.value = full.brand ?? brand.value
		model.value = full.model ?? model.value
		startAvailability.value = full.startAvailability ?? null
		endAvailability.value = full.endAvailability ?? null
	} catch (error) {
		formError.value = apiErrorMessage(error)
	} finally {
		editLoading.value = false
	}
}

// Plate, brand and model are all required by the backend (VehicleWriterDto).
async function submit(): Promise<void> {
	if (!licensePlate.value.trim() || !brand.value.trim() || !model.value.trim()) {
		formError.value = t('vehicles.form.required')
		return
	}
	submitting.value = true
	formError.value = ''
	const fields = {
		licensePlate: licensePlate.value.trim(),
		brand: brand.value.trim(),
		model: model.value.trim(),
		startAvailability: startAvailability.value,
		endAvailability: endAvailability.value,
	}
	try {
		if (editingId.value) {
			await write.update(editingId.value, fields)
		} else {
			await write.create(fields)
		}
		drawerOpen.value = false
	} catch (error) {
		formError.value = apiErrorMessage(error)
	} finally {
		submitting.value = false
	}
}

function confirmDelete(vehicle: VehicleRowDto): void {
	Modal.confirm({
		title: t('common.delete'),
		content: t('vehicles.deleteConfirm', { name: vehicle.licensePlate ?? '' }),
		okText: t('common.delete'),
		okType: 'danger',
		okButtonProps: { 'data-testid': 'vehicle-delete-confirm' },
		cancelText: t('common.cancel'),
		onOk: () => write.remove(vehicle.id),
	})
}
</script>

<template>
	<div>
		<ProjectDomainList
				testid="vehicle"
				:fetch-path="`/api/v2/projects/${projectId}/vehicles`"
				:fetch-key="listKey"
				sort="licensePlate"
				:empty-text="t('vehicles.empty')"
				:extra-query="extraQuery"
		>
			<template #filters>
				<div class="filter-row">
					<FilterSelect
							v-model="filterStatus"
							:label="t('filters.status')"
							:options="statusOptions"
							:placeholder="t('filters.all')"
							testid="vehicle-filter-status"
					/>
					<FilterSelect
							v-model="filterVisible"
							:label="t('filters.visibility')"
							:options="visibilityOptions"
							:placeholder="t('filters.all')"
							testid="vehicle-filter-visible"
					/>
				</div>
			</template>
			<template #toolbar>
				<Button
						v-if="write.canCreate.value"
						type="primary"
						data-testid="vehicle-create"
						@click="openDrawer"
				>
					<template #icon>
						<PlusOutlined/>
					</template>
					{{ t('vehicles.add') }}
				</Button>
			</template>

			<template #item="{ item }">
				<ListItem.Meta>
					<template #title>
						{{ (item as VehicleRowDto).licensePlate }}
					</template>
					<template #description>
						{{ label(item as VehicleRowDto) }}
					</template>
				</ListItem.Meta>
				<Space>
					<Tag
							v-if="(item as VehicleRowDto).status"
							:color="STATUS_COLOR.info"
					>
						{{ (item as VehicleRowDto).status?.label }}
					</Tag>
					<Button
							v-if="canHistory"
							size="small"
							data-testid="vehicle-history"
							@click="openHistory(item as VehicleRowDto)"
					>
						{{ t('history.action') }}
					</Button>
					<ProjectDomainRowActions
							testid="vehicle"
							:visible="(item as VehicleRowDto).visible"
							:can-update="write.canUpdate.value"
							:can-delete="write.canDelete.value"
							:editable="write.canUpdate.value"
							@edit="openEdit(item as VehicleRowDto)"
							@transition="action => write.transition((item as VehicleRowDto).id, action)"
							@delete="confirmDelete(item as VehicleRowDto)"
					/>
				</Space>
			</template>
		</ProjectDomainList>

		<Drawer
				:open="drawerOpen"
				:title="drawerTitle"
				width="380"
				@close="drawerOpen = false"
		>
			<Space
					direction="vertical"
					size="middle"
					style="width: 100%"
			>
				<div>
					<label for="vehicle-plate">{{ t('vehicles.form.licensePlate') }}</label>
					<Input
							id="vehicle-plate"
							v-model:value="licensePlate"
							data-testid="vehicle-form-licenseplate"
							aria-required="true"
					/>
				</div>
				<div>
					<label for="vehicle-brand">{{ t('vehicles.form.brand') }}</label>
					<Input
							id="vehicle-brand"
							v-model:value="brand"
							data-testid="vehicle-form-brand"
							aria-required="true"
					/>
				</div>
				<div>
					<label for="vehicle-model">{{ t('vehicles.form.model') }}</label>
					<Input
							id="vehicle-model"
							v-model:value="model"
							data-testid="vehicle-form-model"
							aria-required="true"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('vehicles.form.startAvailability') }}</span>
					<CustomDateTimeField
							v-model="startAvailability"
							:label="t('vehicles.form.startAvailability')"
							testid="vehicle-form-start"
							:date-placeholder="t('common.date')"
							:time-placeholder="t('common.time')"
					/>
				</div>
				<div>
					<span class="field-label">{{ t('vehicles.form.endAvailability') }}</span>
					<CustomDateTimeField
							v-model="endAvailability"
							:label="t('vehicles.form.endAvailability')"
							testid="vehicle-form-end"
							:date-placeholder="t('common.date')"
							:time-placeholder="t('common.time')"
					/>
				</div>
				<Alert
						v-if="formError"
						type="error"
						show-icon
						role="alert"
						:message="formError"
				/>
				<Space style="width: 100%; justify-content: flex-end">
					<Button
							data-testid="vehicle-form-cancel"
							@click="drawerOpen = false"
					>
						{{ t('common.cancel') }}
					</Button>
					<Button
							type="primary"
							:loading="submitting"
							:disabled="editLoading"
							data-testid="vehicle-form-submit"
							@click="submit"
					>
						{{ editingId ? t('common.save') : t('common.create') }}
					</Button>
				</Space>
			</Space>
		</Drawer>

		<ProjectMovementHistory
				v-model:open="historyOpen"
				:title="historyTitle"
				:fetch-path="historyPath"
		/>
	</div>
</template>

<style scoped>
.field-label {
	display: block;
	margin-bottom: 4px;
}
</style>

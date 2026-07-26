<script setup lang="ts">
import { Dropdown, Menu, MenuItem } from 'ant-design-vue'

/**
 * B2 — the shared per-row action menu (disable/enable/delete) for a
 * project-scoped domain. Shown only when the user holds an action authority;
 * disable vs enable follows the row's visible state. Emits so the page owns
 * the actual mutation + its confirm copy. The #extra slot hosts
 * domain-specific actions (e.g. alert resolve/cancel/reopen) between the
 * opt-in Edit item and the state actions.
 */
const props = defineProps<{
	visible?: boolean | null
	canUpdate: boolean
	canDelete: boolean
	editable?: boolean
	testid?: string
}>()

const testid = (suffix: string) => (props.testid ? `${props.testid}-${suffix}` : undefined)

const emit = defineEmits<{
	edit: []
	transition: [action: 'disable' | 'enable']
	delete: []
}>()

const { t } = useI18n()
</script>

<template>
	<Dropdown
			v-if="canUpdate || canDelete"
			:trigger="['click']"
	>
		<button
				type="button"
				class="icon-btn"
				:aria-label="t('common.options')"
				:data-testid="testid('row-actions')"
		>
			<svg
					viewBox="0 0 24 24"
					width="18"
					height="18"
					fill="currentColor"
					aria-hidden="true"
			>
				<circle
						cx="12"
						cy="5"
						r="1.7"
				/>
				<circle
						cx="12"
						cy="12"
						r="1.7"
				/>
				<circle
						cx="12"
						cy="19"
						r="1.7"
				/>
			</svg>
		</button>
		<template #overlay>
			<Menu>
				<MenuItem
						v-if="editable && canUpdate"
						key="edit"
						:data-testid="testid('action-edit')"
						@click="emit('edit')"
				>
					{{ t('common.edit') }}
				</MenuItem>
				<slot name="extra"/>
				<MenuItem
						v-if="canUpdate && visible !== false"
						key="disable"
						:data-testid="testid('action-disable')"
						@click="emit('transition', 'disable')"
				>
					{{ t('common.disable') }}
				</MenuItem>
				<MenuItem
						v-if="canUpdate && visible === false"
						key="enable"
						:data-testid="testid('action-enable')"
						@click="emit('transition', 'enable')"
				>
					{{ t('common.enable') }}
				</MenuItem>
				<MenuItem
						v-if="canDelete"
						key="delete"
						danger
						:data-testid="testid('action-delete')"
						@click="emit('delete')"
				>
					{{ t('common.delete') }}
				</MenuItem>
			</Menu>
		</template>
	</Dropdown>
</template>

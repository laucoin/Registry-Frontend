<script setup lang="ts">
import { Tag, Tooltip } from 'ant-design-vue'

/**
 * The badge a row wears when its availability window has closed while a movement
 * of theirs is still open. Non-blocking by design: the register records facts and
 * a window only records a plan, so the discrepancy is surfaced rather than acted
 * upon.
 */
defineProps<{ warned?: boolean | null }>()

const { t } = useI18n()
</script>

<template>
	<Tooltip
			v-if="warned"
			:title="t('presence.availabilityWarning.hint')"
	>
		<Tag
				:color="STATUS_COLOR.warning"
				data-testid="availability-warning"
		>
			{{ t('presence.availabilityWarning.label') }}
		</Tag>
	</Tooltip>
</template>

<script setup lang="ts">
import { Alert, Button } from 'ant-design-vue'

/**
 * The inline notice for a failed API call — every list, drawer, form and dialog
 * shows this one rather than assembling an Alert of its own, so a dead session
 * offers its way back in wherever it is discovered (see useSessionReconnect).
 *
 * Two shapes, chosen by `message`: given one, it becomes the heading and the
 * backend's explanation sits under it (a load that failed says so before it says
 * why); without one, the explanation IS the notice, which is what a form
 * rejection needs — its heading would only repeat the field it sits under.
 *
 * `error` takes the raw failure, never a pre-formatted string: the reconnect
 * offer is read off the error body, and a message stringified at the call site
 * has already thrown that away. A local validation string is still accepted (it
 * passes through untouched) so a field's own rejection can share the ref.
 */
const props = defineProps<{
	error: unknown
	message?: string
	testid?: string
	closable?: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { offersReconnect, reconnectLabel, reconnect } = useSessionReconnect()

const explanation = computed(() => apiErrorMessage(props.error, t))
const offered = computed(() => offersReconnect(props.error))
</script>

<template>
	<Alert
			type="error"
			show-icon
			role="alert"
			:closable="closable"
			:message="message ?? explanation"
			:description="message ? explanation : undefined"
			:data-testid="testid"
			@close="emit('close')"
	>
		<template
				v-if="offered"
				#action
		>
			<Button
					type="primary"
					size="small"
					data-testid="session-reconnect"
					@click="reconnect"
			>
				{{ reconnectLabel }}
			</Button>
		</template>
	</Alert>
</template>

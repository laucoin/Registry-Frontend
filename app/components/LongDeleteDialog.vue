<script setup lang="ts">
import { Button, Modal, Space } from 'ant-design-vue'

/**
 * The confirm dialog for a deletion that CASCADES — a project, a group, an
 * activity. Two things it does that `Modal.confirm` cannot:
 *
 *  - it warns, before anything starts, that the operation can take minutes, so
 *    a long wait is expected rather than alarming;
 *  - while it runs it names what is being deleted, one step at a time. The
 *    steps are the shape of the work, not server-reported progress (the API
 *    answers once, at the end) — the copy says so.
 *
 * The dialog stays open and non-dismissible for the whole operation: closing it
 * would not cancel anything, and coming back to a list that has silently
 * changed is worse than waiting in front of a line that moves.
 */
const props = defineProps<{
	title: string
	confirmText: string
	steps: string[]
	testid?: string
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()

const { t } = useI18n()

const running = ref(false)
const error = ref<unknown>('')
const { current, start, stop } = useRotatingStatus(() => props.steps)

/**
 * Owned by the caller: it awaits the API and re-throws on failure, so the
 * dialog can keep the message on screen instead of closing over an error.
 */
async function run(work: () => Promise<void>): Promise<void> {
	running.value = true
	error.value = ''
	start()
	try {
		await work()
		open.value = false
	} catch (cause) {
		error.value = cause
	} finally {
		stop()
		running.value = false
	}
}

function cancel(): void {
	if (!running.value) {
		open.value = false
	}
}

watch(open, (isOpen) => {
	if (!isOpen) {
		error.value = ''
	}
})

defineExpose({ run })
</script>

<template>
	<Modal
			:open="open"
			:title="title"
			:closable="!running"
			:mask-closable="!running"
			:footer="null"
			@cancel="cancel"
	>
		<Space
				direction="vertical"
				size="middle"
				style="width: 100%"
				:data-testid="testid"
		>
			<p class="long-delete__confirm">
				{{ confirmText }}
			</p>

			<!-- Said BEFORE the work starts, not once it feels slow: an expected
           wait is not the same experience as an unexplained one. -->
			<p class="long-delete__warning">
				{{ t('common.longDelete.warning') }}
			</p>

			<p
					v-if="running"
					class="long-delete__step"
					role="status"
					aria-live="polite"
					data-testid="long-delete-step"
			>
				<span
						class="long-delete__spinner"
						aria-hidden="true"
				/>
				{{ current }}
			</p>

			<ApiErrorAlert
					v-if="error"
					:error="error"
			/>

			<Space style="width: 100%; justify-content: flex-end">
				<Button
						:disabled="running"
						data-testid="long-delete-cancel"
						@click="cancel"
				>
					{{ t('common.cancel') }}
				</Button>
				<Button
						danger
						type="primary"
						:loading="running"
						data-testid="long-delete-confirm"
						@click="emit('confirm')"
				>
					{{ t('common.delete') }}
				</Button>
			</Space>
		</Space>
	</Modal>
</template>

<style scoped>
.long-delete__confirm {
	margin: 0;
}

.long-delete__warning {
	margin: 0;
	font-size: 0.9rem;
	opacity: 0.75;
}

.long-delete__step {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	font-weight: 500;
}

.long-delete__spinner {
	width: 14px;
	height: 14px;
	border-radius: 50%;
	border: 2px solid color-mix(in srgb, var(--focus) 30%, transparent);
	border-top-color: var(--focus);
	animation: long-delete-spin 0.8s linear infinite;
}

@keyframes long-delete-spin {
	to {
		transform: rotate(360deg);
	}
}

/* A spinner that never stops is exactly what a vestibular disorder cannot
   tolerate; the step text already carries the information. */
@media (prefers-reduced-motion: reduce) {
	.long-delete__spinner {
		animation: none;
	}
}
</style>

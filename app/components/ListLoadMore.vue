<script setup lang="ts">
import { Button, Spin } from 'ant-design-vue'

/**
 * The foot of every lazily loaded list: an invisible sentinel that pulls the
 * next chunk as it comes into view, and under it a real button doing the same.
 *
 * The button is not a fallback. Loading on scroll is unreachable by keyboard
 * and invisible to assistive technology, so the same action needs an operable
 * control (WCAG 2.1.1) and the rows that appear need to be reported (4.1.3) —
 * that is the polite region, deliberately not an alert: rows arriving is a
 * status, not a problem. The button stays ENABLED while a chunk loads, because
 * AntD's `loading` disables it and a disabled control drops focus to the body
 * mid-load, losing the reader's place; `aria-busy` says so instead and the
 * handler declines.
 *
 * A sentinel rather than a scroll listener because several of these lists live
 * inside an AntD drawer, whose scrolling element is a portal node the component
 * never holds a reference to — an observer does not need to know which ancestor
 * scrolls.
 */
const props = defineProps<{
	hasMore: boolean
	loading: boolean
	loaded: number
	total: number
	testid?: string
}>()

const emit = defineEmits<{ load: [] }>()

const { t } = useI18n()

const testid = (suffix: string) => (props.testid ? `${props.testid}-${suffix}` : undefined)

const sentinel = useTemplateRef<HTMLElement>('sentinel')

function request(): void {
	if (props.hasMore && !props.loading) {
		emit('load')
	}
}

/**
 * The margin starts the next chunk while the sentinel is still a screenful
 * below the fold, so the rows are already there when the reader arrives.
 */
useIntersectionObserver(sentinel, ([entry]) => {
	if (entry?.isIntersecting) {
		request()
	}
}, { rootMargin: '200px 0px' })
</script>

<template>
	<div
			v-if="total > 0"
			class="load-more"
			:aria-busy="loading"
	>
		<div
				v-if="hasMore"
				ref="sentinel"
				class="load-more__sentinel"
				aria-hidden="true"
		/>
		<p
				class="sr-only"
				aria-live="polite"
		>
			{{ hasMore ? t('common.list.loaded', { loaded, total }) : t('common.list.allLoaded', { total }) }}
		</p>
		<div class="load-more__controls">
			<Spin
					v-if="loading"
					size="small"
			/>
			<Button
					v-if="hasMore"
					type="link"
					:data-testid="testid('load-more')"
					@click="request"
			>
				{{ t('common.list.loadMore') }}
			</Button>
		</div>
	</div>
</template>

<style scoped>
.load-more {
	position: relative;
}

.load-more__controls {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 32px;
}

/**
 * Out of flow and a hair tall: the observer needs a node with a box to watch,
 * and one the layout does not reserve room for cannot shift the rows above it
 * as the list grows.
 */
.load-more__sentinel {
	position: absolute;
	inset-inline: 0;
	top: 0;
	height: 1px;
}
</style>

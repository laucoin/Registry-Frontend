import type { Mock } from 'vitest'
import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref, Suspense } from 'vue'
import DomainList from '../../app/components/project/DomainList.vue'

/**
 * The chrome every domain list shares. What is pinned here is the shape the
 * eight surfaces behind it inherit for free: rows come from the accumulated
 * window rather than one page, there is no page selector left to click, and the
 * two loading states stay apart — the list only greys out when the window
 * itself is being re-read, never when a chunk is arriving under it.
 *
 * useLazyList is stubbed: it has its own tests, and mounting through it would
 * test Nuxt's fetch rather than this component.
 */
const ROWS = [{ id: 'a', visible: true }, { id: 'b', visible: false }]

let loadMoreMock: Mock

function mountList(overrides: Record<string, unknown> = {}, props: Record<string, unknown> = {}) {
	vi.stubGlobal('useLazyList', () => Promise.resolve({
		data: ref({ lastRefresh: '2026-08-18T09:00:00Z' }),
		items: computed(() => ROWS),
		total: computed(() => 87),
		hasMore: computed(() => true),
		error: ref(null),
		status: ref('success'),
		loadingMore: ref(false),
		loadMore: loadMoreMock,
		...overrides,
	}))

	const Host = defineComponent({
		render: () => h(Suspense, null, {
			default: () => h(DomainList, {
				fetchPath: '/api/v2/projects/p1/participants',
				fetchKey: 'participants-p1',
				sort: 'lastName',
				emptyText: 'Nothing here',
				searchLabels: ['Name'],
				testid: 'participant',
				...props,
			}),
		}),
	})

	return mount(Host, {
		attachTo: document.body,
		global: {
			stubs: {
				ApiErrorAlert: { template: '<div class="api-error"/>' },
				ListSearchPanel: { template: '<div class="search-panel"/>' },
				ListLoadMore: {
					props: ['hasMore', 'loading', 'loaded', 'total', 'testid'],
					template: '<div class="load-more" :data-loaded="loaded" :data-loading="String(loading)"'
						+ ' @click="$emit(\'load\')"/>',
				},
			},
		},
	})
}

async function flush(wrapper: ReturnType<typeof mountList>) {
	await new Promise(resolve => setTimeout(resolve))
	await wrapper.vm.$nextTick()
}

describe('DomainList', () => {
	beforeEach(() => {
		loadMoreMock = vi.fn()
		vi.stubGlobal('ref', ref)
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('DEFAULT_PAGE_SIZE', 20)
		vi.stubGlobal('useI18n', () => ({
			t: (key: string) => key,
			d: (value: Date) => value.toISOString().slice(0, 10),
		}))
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('renders every row the window holds and offers no page selector', async () => {
		// Arrange
		const wrapper = mountList()

		// Act
		await flush(wrapper)

		// Assert
		expect(wrapper.findAll('[data-testid="participant-row"]')).toHaveLength(2)
		expect(wrapper.find('.ant-pagination').exists()).toBe(false)
		expect(wrapper.get('.load-more').attributes('data-loaded')).toBe('2')

		wrapper.unmount()
	})

	it('hands the next chunk request back to the engine', async () => {
		// Arrange
		const wrapper = mountList()
		await flush(wrapper)

		// Act
		await wrapper.get('.load-more').trigger('click')

		// Assert
		expect(loadMoreMock).toHaveBeenCalledTimes(1)

		wrapper.unmount()
	})

	/**
	 * Greying the rows out while a chunk arrives under them is the one thing
	 * loading on scroll must not do — the reader is still reading them.
	 */
	it('greys the list out for a re-read, never for an arriving chunk', async () => {
		// Arrange
		const wrapper = mountList({ loadingMore: ref(true) })

		// Act
		await flush(wrapper)

		// Assert
		expect(wrapper.find('.ant-spin-spinning').exists()).toBe(false)
		expect(wrapper.get('.load-more').attributes('data-loading')).toBe('true')

		wrapper.unmount()
	})

	it('shows the empty state instead of a list when nothing matches', async () => {
		// Arrange
		const wrapper = mountList({ total: computed(() => 0), items: computed(() => []) })

		// Act
		await flush(wrapper)

		// Assert
		expect(wrapper.find('[data-testid="participant-list"]').exists()).toBe(false)
		expect(wrapper.find('.load-more').exists()).toBe(false)
		expect(wrapper.text()).toContain('Nothing here')

		wrapper.unmount()
	})

	it('has no axe violations', async () => {
		// Arrange
		const wrapper = mountList()
		await flush(wrapper)

		// Act
		const results = await axe.run(wrapper.element as HTMLElement)

		// Assert
		expect(results.violations.map(violation => `${violation.id}: ${violation.help}`)).toEqual([])

		wrapper.unmount()
	})
})

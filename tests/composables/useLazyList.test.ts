import type { Mock } from 'vitest'
import type { Ref } from 'vue'
import type { PageDto } from '@shared/utils/api-types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref, watch } from 'vue'
import { useLazyList } from '../../app/composables/useLazyList'

/**
 * The list engine's contract, and it is mostly about what does NOT happen: the
 * keyed fetch asks for the whole loaded window so a mutation re-reads it in one
 * request, the chunks it does not own arrive through $fetch, and neither path
 * may ever show a row twice or ask the backend for more rows than it accepts.
 *
 * The Nuxt auto-imports vitest does not apply are stubbed as globals.
 */
interface Row { id: string }

const PAGE_SIZE = 20

function rows(from: number, count: number): Row[] {
	return Array.from({ length: count }, (_, index) => ({ id: `r${from + index}` }))
}

function page(content: Row[], totalElements: number): PageDto<Row> {
	return {
		pageNumber: 0,
		pageSize: content.length,
		totalPages: Math.ceil(totalElements / PAGE_SIZE),
		totalElements,
		content,
		lastRefresh: '2026-08-18T09:00:00Z',
	}
}

let data: Ref<PageDto<Row> | null>
let keyedQuery: Ref<Record<string, unknown>>
let refreshMock: Mock
let fetchMock: Mock

function setUp(initial: PageDto<Row>) {
	data = ref(initial)
	refreshMock = vi.fn()
	fetchMock = vi.fn()
	vi.stubGlobal('useFetch', (_path: unknown, options: { query: Ref<Record<string, unknown>> }) => {
		keyedQuery = options.query
		return { data, error: ref(null), status: ref('success'), refresh: refreshMock }
	})
	vi.stubGlobal('$fetch', fetchMock)
}

function lazyList(query: () => Record<string, unknown> = () => ({ sort: 'name' })) {
	return useLazyList<Row>({
		fetchPath: () => '/api/v2/participants',
		fetchKey: 'participants',
		query,
		pageSize: PAGE_SIZE,
	})
}

describe('useLazyList', () => {
	beforeEach(() => {
		vi.stubGlobal('ref', ref)
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('watch', watch)
		vi.stubGlobal('DEFAULT_PAGE_SIZE', PAGE_SIZE)
		vi.stubGlobal('useRegistryMessage', () => ({ apiError: vi.fn() }))
		setUp(page(rows(0, PAGE_SIZE), 87))
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('opens on a single chunk, read as the first page', async () => {
		// Arrange + Act
		const list = await lazyList()

		// Assert
		expect(keyedQuery.value).toEqual({ page: 0, size: 20, sort: 'name' })
		expect(list.items.value).toHaveLength(20)
		expect(list.total.value).toBe(87)
		expect(list.hasMore.value).toBe(true)
	})

	it('pulls the next chunk on its own and appends it', async () => {
		// Arrange
		const list = await lazyList()
		fetchMock.mockResolvedValue(page(rows(20, PAGE_SIZE), 87))

		// Act
		await list.loadMore()

		// Assert
		expect(fetchMock).toHaveBeenCalledWith('/api/v2/participants', {
			query: { page: 1, size: 20, sort: 'name' },
		})
		expect(list.items.value.map(row => row.id)).toEqual(rows(0, 40).map(row => row.id))
	})

	/**
	 * A row created while the reader was scrolling shifts every later offset, so
	 * the same row can come back in two chunks. It is shown once.
	 */
	it('never shows a row twice when the offsets shift under it', async () => {
		// Arrange
		const list = await lazyList()
		fetchMock.mockResolvedValue(page([...rows(19, 1), ...rows(20, 5)], 87))

		// Act
		await list.loadMore()

		// Assert
		expect(list.items.value).toHaveLength(25)
		expect(new Set(list.items.value.map(row => row.id)).size).toBe(25)
	})

	it('stops asking once every row is held', async () => {
		// Arrange
		setUp(page(rows(0, PAGE_SIZE), 30))
		const list = await lazyList()
		fetchMock.mockResolvedValue(page(rows(20, 10), 30))

		// Act
		await list.loadMore()

		// Assert
		expect(list.hasMore.value).toBe(false)
		await list.loadMore()
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('asks for the whole loaded window, so a mutation re-reads it in one request', async () => {
		// Arrange
		const list = await lazyList()
		fetchMock.mockResolvedValue(page(rows(20, PAGE_SIZE), 87))

		// Act
		await list.loadMore()
		await list.loadMore()
		await list.loadMore()

		// Assert
		expect(keyedQuery.value).toEqual({ page: 0, size: 80, sort: 'name' })
	})

	/**
	 * This is what makes every refreshNuxtData caller correct: the response the
	 * refresh brings back already contains the appended rows, freshly read, so
	 * keeping the old ones would show half the list twice.
	 */
	it('drops the appended chunks when a fresh response for the key lands', async () => {
		// Arrange
		const list = await lazyList()
		fetchMock.mockResolvedValue(page(rows(20, PAGE_SIZE), 87))
		await list.loadMore()

		// Act
		data.value = page(rows(0, 40), 86)
		await nextTick()

		// Assert
		expect(list.items.value).toHaveLength(40)
		expect(list.total.value).toBe(86)
	})

	it('restarts the window and re-reads when the search or ordering narrows', async () => {
		// Arrange
		const sort = ref('name')
		const list = await lazyList(() => ({ sort: sort.value }))
		fetchMock.mockResolvedValue(page(rows(20, PAGE_SIZE), 87))
		await list.loadMore()

		// Act
		sort.value = 'lastName'
		await nextTick()

		// Assert
		expect(refreshMock).toHaveBeenCalledTimes(1)
		expect(keyedQuery.value).toEqual({ page: 0, size: 20, sort: 'lastName' })
		expect(list.items.value).toHaveLength(20)
	})

	/**
	 * Every v2 endpoint refuses a `size` above MAX_PAGE_SIZE. Scrolling past the
	 * ceiling keeps working — only the window the refresh re-reads is capped.
	 */
	it('never asks the backend for more rows than it accepts', async () => {
		// Arrange
		setUp(page(rows(0, PAGE_SIZE), 500))
		const list = await lazyList()

		// Act
		for (let chunk = 1; chunk <= 11; chunk += 1) {
			fetchMock.mockResolvedValue(page(rows(chunk * PAGE_SIZE, PAGE_SIZE), 500))
			await list.loadMore()
		}

		// Assert
		expect(keyedQuery.value).toEqual({ page: 0, size: 200, sort: 'name' })
		expect(list.items.value).toHaveLength(240)
	})

	it('discards a chunk that lands after the list it was asked for is gone', async () => {
		// Arrange
		const list = await lazyList()
		let release: (value: PageDto<Row>) => void = () => {}
		fetchMock.mockReturnValue(new Promise<PageDto<Row>>((resolve) => {
			release = resolve
		}))

		// Act
		const pending = list.loadMore()
		data.value = page(rows(0, PAGE_SIZE), 87)
		await nextTick()
		release(page(rows(20, PAGE_SIZE), 87))
		await pending

		// Assert
		expect(list.items.value).toHaveLength(20)
		expect(keyedQuery.value).toEqual({ page: 0, size: 20, sort: 'name' })
	})
})

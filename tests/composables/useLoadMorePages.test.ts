import type { Mock } from 'vitest'
import type { PageDto } from '@shared/utils/api-types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { useLoadMorePages } from '../../app/composables/useLoadMorePages'

/**
 * The engine for the lists Nuxt's cache does not hold — drawers that read on
 * open. What is pinned here is the invalidation they have instead of
 * refreshNuxtData: `reload` restarts the chunks rather than appending onto
 * offsets a write has moved, and a response for a subject the drawer has since
 * left is dropped rather than shown under the new one.
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

let fetchMock: Mock

function loadMorePages(path: () => string | null = () => '/api/v2/participants/p1/movements') {
	return useLoadMorePages<Row>({
		fetchPath: path,
		query: () => ({ sort: 'dateTime', direction: 'DESC' }),
		pageSize: PAGE_SIZE,
	})
}

describe('useLoadMorePages', () => {
	beforeEach(() => {
		fetchMock = vi.fn()
		vi.stubGlobal('ref', ref)
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('$fetch', fetchMock)
		vi.stubGlobal('useRegistryMessage', () => ({ apiError: vi.fn() }))
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('opens on a single chunk', async () => {
		// Arrange
		const list = loadMorePages()
		fetchMock.mockResolvedValue(page(rows(0, PAGE_SIZE), 87))

		// Act
		await list.reload()

		// Assert
		expect(fetchMock).toHaveBeenCalledWith('/api/v2/participants/p1/movements', {
			query: { page: 0, size: 20, sort: 'dateTime', direction: 'DESC' },
		})
		expect(list.items.value).toHaveLength(20)
		expect(list.total.value).toBe(87)
		expect(list.hasMore.value).toBe(true)
	})

	it('appends the next chunk, and never a row it already holds', async () => {
		// Arrange
		const list = loadMorePages()
		fetchMock.mockResolvedValue(page(rows(0, PAGE_SIZE), 87))
		await list.reload()
		fetchMock.mockResolvedValue(page([...rows(19, 1), ...rows(20, 5)], 87))

		// Act
		await list.loadMore()

		// Assert
		expect(fetchMock).toHaveBeenLastCalledWith('/api/v2/participants/p1/movements', {
			query: { page: 1, size: 20, sort: 'dateTime', direction: 'DESC' },
		})
		expect(list.items.value).toHaveLength(25)
		expect(new Set(list.items.value.map(row => row.id)).size).toBe(25)
	})

	it('stops asking once every row is held', async () => {
		// Arrange
		const list = loadMorePages()
		fetchMock.mockResolvedValue(page(rows(0, PAGE_SIZE), 20))

		// Act
		await list.reload()

		// Assert
		expect(list.hasMore.value).toBe(false)
		await list.loadMore()
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	/**
	 * A write shifts every later offset, so the chunks are read again from the
	 * top rather than appended to — appending onto offsets that have moved is
	 * how a row goes missing.
	 */
	it('restarts the chunks on reload rather than appending to them', async () => {
		// Arrange
		const list = loadMorePages()
		fetchMock.mockResolvedValue(page(rows(0, PAGE_SIZE), 87))
		await list.reload()
		await list.loadMore()

		// Act
		fetchMock.mockResolvedValue(page(rows(0, PAGE_SIZE), 86))
		await list.reload()

		// Assert
		expect(fetchMock).toHaveBeenLastCalledWith('/api/v2/participants/p1/movements', {
			query: { page: 0, size: 20, sort: 'dateTime', direction: 'DESC' },
		})
		expect(list.items.value).toHaveLength(20)
		expect(list.total.value).toBe(86)
	})

	it('reads nothing while the drawer has no subject', async () => {
		// Arrange
		const list = loadMorePages(() => null)

		// Act
		await list.reload()
		await list.loadMore()

		// Assert
		expect(fetchMock).not.toHaveBeenCalled()
		expect(list.items.value).toEqual([])
	})

	it('drops a chunk that lands after the drawer has moved on', async () => {
		// Arrange
		const list = loadMorePages()
		let release: (value: PageDto<Row>) => void = () => {}
		fetchMock.mockReturnValue(new Promise<PageDto<Row>>((resolve) => {
			release = resolve
		}))

		// Act
		const pending = list.reload()
		list.reset()
		release(page(rows(0, PAGE_SIZE), 87))
		await pending

		// Assert
		expect(list.items.value).toEqual([])
		expect(list.total.value).toBe(0)
	})
})

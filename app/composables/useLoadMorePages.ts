import type { Ref } from 'vue'
import type { PageDto } from '@shared/utils/api-types'
import { DEFAULT_PAGE_SIZE } from '@/utils/list'

/**
 * The list engine for the surfaces Nuxt's cache does not hold: drawers and
 * panels that read on open with a plain `$fetch` rather than a keyed one. It
 * accumulates chunks client-side, which is why nothing here has to respect the
 * `MAX_PAGE_SIZE` ceiling — no single request ever asks for more than a chunk.
 *
 * `reload` is the invalidation these surfaces have instead of
 * `refreshNuxtData`: opening the drawer, and any write that shifts the offsets
 * under the rows already held. Calling it is not optional after a mutation —
 * appending onto offsets that have moved is how a row goes missing.
 *
 * Rows are de-duplicated by id on append, so a concurrent write cannot show one
 * twice; a row can still slip through the seam between two chunks, and the next
 * reload is what heals it.
 */
export function useLoadMorePages<T extends { id: string }>(options: {
	fetchPath: () => string | null
	query?: () => Record<string, unknown>
	pageSize?: number
}) {
	const registryMessage = useRegistryMessage()

	const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE

	const items = ref([]) as Ref<T[]>
	const total = ref(0)
	/**
	 * Counted in requested chunks rather than in rows held: de-duplication can
	 * shrink the buffer, and an offset derived from it would ask for a chunk
	 * already read, forever.
	 */
	const loadedChunks = ref(0)
	const loading = ref(false)
	const loadingMore = ref(false)
	const error = ref<unknown>('')
	/**
	 * Bumped whenever the rows held stop being what a chunk in flight was asked
	 * for, so a response for a list that no longer exists is dropped.
	 */
	const generation = ref(0)

	const hasMore = computed(() => loadedChunks.value * pageSize < total.value)

	function chunkQuery(page: number): Record<string, unknown> {
		return { page, size: pageSize, ...(options.query?.() ?? {}) }
	}

	function reset(): void {
		items.value = []
		total.value = 0
		loadedChunks.value = 0
		error.value = ''
		generation.value += 1
	}

	async function reload(): Promise<void> {
		const path = options.fetchPath()
		if (!path) {
			reset()
			return
		}
		reset()
		const asked = generation.value
		loading.value = true
		try {
			const first = await $fetch<PageDto<T>>(path, { query: chunkQuery(0) })
			if (asked !== generation.value) {
				return
			}
			items.value = first.content ?? []
			total.value = first.totalElements ?? items.value.length
			loadedChunks.value = 1
		} catch (cause) {
			if (asked === generation.value) {
				error.value = cause
			}
		} finally {
			if (asked === generation.value) {
				loading.value = false
			}
		}
	}

	async function loadMore(): Promise<void> {
		const path = options.fetchPath()
		if (!path || loading.value || loadingMore.value || !hasMore.value) {
			return
		}
		const asked = generation.value
		loadingMore.value = true
		try {
			const next = await $fetch<PageDto<T>>(path, { query: chunkQuery(loadedChunks.value) })
			if (asked !== generation.value) {
				return
			}
			const seen = new Set(items.value.map(row => row.id))
			items.value = [...items.value, ...(next.content ?? []).filter(row => !seen.has(row.id))]
			total.value = next.totalElements ?? total.value
			loadedChunks.value += 1
		} catch (cause) {
			registryMessage.apiError(cause)
		} finally {
			if (asked === generation.value) {
				loadingMore.value = false
			}
		}
	}

	return { items, total, hasMore, loading, loadingMore, error, reload, loadMore, reset }
}

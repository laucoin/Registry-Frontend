import type { Ref } from 'vue'
import type { PageDto } from '@shared/utils/api-types'
import { DEFAULT_PAGE_SIZE } from '@/utils/list'
import { MAX_PAGE_SIZE } from '@shared/utils/api-types'

/**
 * The engine behind every server-read list. The keyed fetch holds a GROWING
 * FIRST PAGE (`page=0&size=<window>`) while `loadMore` pulls the next chunk on
 * its own (`page=N&size=<chunk>`) and appends it.
 *
 * The two request shapes exist for one reason. `refreshNuxtData(fetchKey)` is
 * this app's only list invalidation, and it re-runs the keyed fetch with
 * whatever query the options hold at that instant — because that query asks for
 * the whole loaded window, a create or a delete re-reads every row on screen in
 * ONE request: no stale chunk, no duplicated row, and the reader is not thrown
 * back to the top of a list they were working down. `watch: false` is what
 * stops the window from re-fetching as it grows; only a narrowing or a mutation
 * may re-read.
 *
 * Two limits the offset grammar imposes, stated rather than papered over:
 *  - The window stops at `MAX_PAGE_SIZE`, which no v2 endpoint accepts beyond.
 *    Scrolling past that ceiling still works — the chunks keep coming — but a
 *    refresh there can only re-read the first `MAX_PAGE_SIZE` rows, so the list
 *    trims back to them and the reader loads the rest again.
 *  - A mutation landing between two chunks shifts every later offset. Rows are
 *    de-duplicated by id on append, so nothing is shown twice; a row can still
 *    slip through the seam, and the next refresh is what heals it. `PageDto`
 *    carries no cursor, so this is the floor.
 */
export async function useLazyList<T extends { id: string }>(options: {
	fetchPath: () => string
	fetchKey: string
	query: () => Record<string, unknown>
	pageSize?: number
}) {
	const registryMessage = useRegistryMessage()

	const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
	const maxPages = Math.max(1, Math.floor(MAX_PAGE_SIZE / pageSize))

	const loadedPages = ref(1)
	const tail = ref([]) as Ref<T[]>
	const loadingMore = ref(false)
	/**
	 * Bumped whenever the loaded rows stop being what a chunk in flight was
	 * asked for. A response coming back under an old generation describes a list
	 * that no longer exists, and is dropped.
	 */
	const generation = ref(0)

	const windowSize = computed(() => Math.min(loadedPages.value, maxPages) * pageSize)

	const { data, error, status, refresh } = await useFetch<PageDto<T>>(options.fetchPath, {
		key: options.fetchKey,
		watch: false,
		query: computed(() => ({ page: 0, size: windowSize.value, ...options.query() })),
	})

	const items = computed(() => {
		const head = data.value?.content ?? []
		const seen = new Set(head.map(row => row.id))
		return [...head, ...tail.value.filter(row => !seen.has(row.id))]
	})

	const total = computed(() => data.value?.totalElements ?? 0)

	/**
	 * Counted in requested chunks rather than in rows held: de-duplication can
	 * shrink the buffer, and an offset derived from it would ask for a chunk
	 * already read, forever.
	 */
	const hasMore = computed(() => loadedPages.value * pageSize < total.value)

	/**
	 * A fresh response for the key already carries — freshly read — every row
	 * the tail had accumulated, which is what keeps every refreshNuxtData caller
	 * correct. It carries at most a window's worth, so anything loaded past the
	 * ceiling is gone and the count has to say so, or the next chunk would be
	 * fetched from an offset with a hole in front of it.
	 */
	watch(data, () => {
		tail.value = []
		loadedPages.value = Math.min(loadedPages.value, maxPages)
		generation.value += 1
	})

	/**
	 * Any narrowing — a new search, ordering or filter — restarts the window:
	 * the rows being read may not exist in the next result set.
	 */
	watch(() => JSON.stringify(options.query()), () => {
		loadedPages.value = 1
		tail.value = []
		generation.value += 1
		refresh()
	})

	async function loadMore(): Promise<void> {
		if (loadingMore.value || !hasMore.value) {
			return
		}
		const asked = generation.value
		loadingMore.value = true
		try {
			const next = await $fetch<PageDto<T>>(options.fetchPath(), {
				query: { page: loadedPages.value, size: pageSize, ...options.query() },
			})
			if (asked !== generation.value) {
				return
			}
			tail.value = [...tail.value, ...(next.content ?? [])]
			loadedPages.value += 1
		} catch (cause) {
			registryMessage.apiError(cause)
		} finally {
			if (asked === generation.value) {
				loadingMore.value = false
			}
		}
	}

	return { data, items, total, hasMore, status, error, loadingMore, loadMore, refresh }
}

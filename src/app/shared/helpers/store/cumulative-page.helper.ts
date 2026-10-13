import { GenericModel } from '@shared/models/model/generic.model'
import { PageModel } from '@shared/models/model/page.model'

export interface CumulativePageRequest {
    page: number | undefined
    size: number | undefined
    batchSize?: number
}

/**
 * Purpose: Builds the page shown by a list that loads its elements batch after batch.
 * Scope: Appends a freshly fetched batch to the page already shown, or rebuilds the shown page from a single reload request.
 * Limits: Pure functions; the store decides when to use them and the api still serves plain pages.
 */
export class CumulativePageHelper {
    public static merge<M extends GenericModel> (
        current: PageModel<M> | undefined,
        fetched: PageModel<M>,
        request: CumulativePageRequest,
    ): PageModel<M> {
        if (request.batchSize !== undefined) {
            return CumulativePageHelper.rebuilt( fetched, request.batchSize )
        }
        if (current && request.page === current.page + 1) {
            return CumulativePageHelper.appended( current, fetched )
        }
        return fetched
    }

    public static reloadRequest (current: PageModel<GenericModel> | undefined): CumulativePageRequest {
        if (!current) {
            return { page: undefined, size: undefined }
        }
        return {
            page: 0,
            size: current.size * (current.page + 1),
            batchSize: current.size,
        }
    }

    public static hasMore (page: PageModel<GenericModel> | undefined): boolean {
        return !!page && page.page + 1 < page.totalPages
    }

    private static appended<M extends GenericModel> (current: PageModel<M>, fetched: PageModel<M>): PageModel<M> {
        return {
            ...fetched,
            size: current.size,
            content: [ ...current.content, ...fetched.content ],
        }
    }

    private static rebuilt<M extends GenericModel> (fetched: PageModel<M>, batchSize: number): PageModel<M> {
        const batches: number = Math.max( 1, Math.ceil( fetched.content.length / batchSize ) )
        return {
            ...fetched,
            size: batchSize,
            page: batches - 1,
            totalPages: Math.ceil( fetched.totalElements / batchSize ),
        }
    }
}

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
 * Limits: Pure functions; a reload never asks for more rows than the backend page size cap, so a long list is reloaded up to the last whole batch under that cap.
 */
export class CumulativePageHelper {
    private static readonly MAX_PAGE_SIZE: number = 200

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
            size: CumulativePageHelper.reloadSize( current ),
            batchSize: current.size,
        }
    }

    private static reloadSize (current: PageModel<GenericModel>): number {
        const wholeBatches: number = Math.max( 1, Math.floor( CumulativePageHelper.MAX_PAGE_SIZE / current.size ) )
        return current.size * Math.min( current.page + 1, wholeBatches )
    }

    public static hasMore (page: PageModel<GenericModel> | undefined): boolean {
        return !!page && page.hasNext
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

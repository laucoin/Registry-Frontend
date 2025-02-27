import { GenericModel } from './generic.model'

export interface PageModel<T extends GenericModel> {
    pageNumber: number
    pageSize: number
    totalElements: number
    totalPages: number
    content: T[]
    lastRefresh: Date
}

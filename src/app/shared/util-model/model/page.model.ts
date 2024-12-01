import { GenericModel } from './generic.model'

export interface PageModel<T extends GenericModel> {
    offset: number
    limit: number
    totalElements: number
    content: T[]
    lastRefresh: Date
}

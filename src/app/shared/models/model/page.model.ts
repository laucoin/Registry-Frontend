import { GenericModel } from '@shared/models/model/generic.model'

export interface PageModel<T extends GenericModel> {
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    content: T[]
    lastRefresh: Date
}

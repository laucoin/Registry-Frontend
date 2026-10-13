import { GenericModel } from '@shared/models/model/generic.model'

export interface PageModel<T extends GenericModel> {
    page: number
    size: number
    totalElements: number
    totalPages: number
    content: T[]
    lastRefresh: Date
}

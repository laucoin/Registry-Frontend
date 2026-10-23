export interface PageResponseDto<T> {
    pageNumber: number
    pageSize: number
    totalElements: number
    totalPages: number
    content: T[]
    lastRefresh: Date
}

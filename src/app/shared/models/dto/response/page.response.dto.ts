export interface PageResponseDto<T> {
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    content: T[]
    lastRefresh: Date
}

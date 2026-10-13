export interface PageResponseDto<T> {
    page: number
    size: number
    totalElements: number
    totalPages: number
    content: T[]
    lastRefresh: Date
}

export interface ErrorModel extends Error {
    timestamp?: Date
    status?: number
    error: string
    message: string
    path?: string
    args?: Record<string, unknown>
    exceptionType?: string
    exceptionMessage?: string
}

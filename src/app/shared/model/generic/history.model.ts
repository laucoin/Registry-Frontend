export interface HistoryModel {
    date: Date | undefined
    user: {
        id: string
        firstName: string
        lastName: string
        email: string
        visible: boolean
    } | undefined
}

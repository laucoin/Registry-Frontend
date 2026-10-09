export interface NotificationModel {
    severity?: string | undefined
    summary?: string | undefined
    detail?: string | undefined
    icon?: string | undefined
    data?: object | undefined
    closable?: boolean | undefined
    life?: number | undefined
    sticky?: boolean | undefined
}

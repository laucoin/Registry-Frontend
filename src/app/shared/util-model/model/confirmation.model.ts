export interface ConfirmationModel {
    header: string
    message: string
    icon: string | undefined
    acceptSeverity: 'success' | 'info' | 'warning' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null | undefined
    rejectSeverity: 'success' | 'info' | 'warning' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null | undefined
    confirmProperty: string | undefined
}

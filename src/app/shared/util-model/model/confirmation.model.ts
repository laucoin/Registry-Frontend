export interface ConfirmationModel {
    header: string
    message: string
    hint?: string
    icon: string | undefined
    acceptSeverity: 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null | undefined
    rejectSeverity: 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null | undefined
    confirmProperty: string | undefined
}

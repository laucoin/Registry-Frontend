import { ButtonSeverity } from 'primeng/button'

export interface ConfirmationModel {
    header: string
    message: string
    hint?: string | undefined
    icon?: string | undefined
    acceptSeverity: ButtonSeverity
    rejectSeverity: ButtonSeverity
    confirmProperty?: string | undefined
}

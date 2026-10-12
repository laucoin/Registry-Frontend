import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

export interface ConfirmationModel {
    header: string
    message: string
    icon: string
    acceptSeverity: SeverityEnum
    accept: () => void
}

import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { OptionalProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { SelectItem } from 'primeng/api'

export interface AlertResponseDto extends OptionalProjectResponseDto {
    dateTime: Date
    title: string
    status: SelectItem<AlertStatusEnum>
    communications: CommunicationResponseDto[] | undefined
}

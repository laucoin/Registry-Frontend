import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { OptionalProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface AlertResponseDto extends OptionalProjectResponseDto {
    dateTime: Date
    title: string
    status: SelectOptionModel<AlertStatusEnum>
    communications: CommunicationResponseDto[] | undefined
}

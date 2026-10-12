import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface AlertResponseDto extends GenericResponseDto {
    dateTime: Date
    title: string
    status: SelectOptionModel<AlertStatusEnum>
    communications: CommunicationResponseDto[] | undefined
}

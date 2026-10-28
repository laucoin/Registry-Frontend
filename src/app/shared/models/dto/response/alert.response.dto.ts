import { AlertCriticalityEnum } from '@shared/models/enumeration/alert-criticality.enum'
import { AlertLastCommunicationResponseDto } from '@shared/models/dto/response/alert-last-communication.response.dto'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface AlertResponseDto extends GenericResponseDto {
    dateTime: Date
    title: string
    status: SelectOptionModel<AlertStatusEnum>
    criticality: SelectOptionModel<AlertCriticalityEnum> | undefined
    lastCommunication: AlertLastCommunicationResponseDto | undefined
    communications: CommunicationResponseDto[] | undefined
}

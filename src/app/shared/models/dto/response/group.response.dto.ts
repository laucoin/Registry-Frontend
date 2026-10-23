import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface GroupResponseDto extends GenericResponseDto {
    name: string
    status: SelectOptionModel<AvailabilityStatusEnum> | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    membersCount: number
    insideMembersCount: number
    outsideMembersCount: number
    members: ParticipantResponseDto[] | undefined
}

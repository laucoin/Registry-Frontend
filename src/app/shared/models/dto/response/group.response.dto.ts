import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { OptionalProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { SelectItem } from 'primeng/api'

export interface GroupResponseDto extends OptionalProjectResponseDto {
    name: string
    status: SelectItem<AvailabilityStatusEnum> | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    membersCount: number
    insideMembersCount: number
    outsideMembersCount: number
    members: ParticipantResponseDto[] | undefined
}

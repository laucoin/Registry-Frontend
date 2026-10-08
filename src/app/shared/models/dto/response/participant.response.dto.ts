import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GenericProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { SelectItem } from 'primeng/api'
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto'

export interface ParticipantResponseDto extends GenericProjectResponseDto {
    firstName: string
    lastName: string
    birthday: string
    major: boolean
    type: SelectItem<ParticipantTypeEnum>
    groups: GroupResponseDto[] | undefined
    status: SelectItem<PresenceStatusEnum>
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    user: UserResponseDto | undefined
    purged: boolean
}

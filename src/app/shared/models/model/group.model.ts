import { GenericModel } from '@shared/models/model/generic.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

export interface GroupModel extends GenericModel {
    name: string
    status: SelectOptionModel<AvailabilityStatusEnum> | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    membersCount: number
    insideMembersCount: number
    outsideMembersCount: number
    members: ParticipantModel[] | undefined
}

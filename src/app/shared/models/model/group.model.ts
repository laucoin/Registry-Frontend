import { GenericProjectModel } from '@shared/models/model/generic-project.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { SelectItem } from 'primeng/api'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

export interface GroupModel extends GenericProjectModel {
    name: string
    status: SelectItem<AvailabilityStatusEnum> | undefined
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    membersCount: number
    insideMembersCount: number
    outsideMembersCount: number
    members: ParticipantModel[] | undefined
}

import { GenericProjectModel } from './generic-project.model'
import { ParticipantModel } from './participant.model'
import { CustomDatetimeModel } from './custom-datetime.model'
import { SelectItem } from 'primeng/api'
import { AvailabilityStatusEnum } from '../enumeration/availability-status.enum'

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

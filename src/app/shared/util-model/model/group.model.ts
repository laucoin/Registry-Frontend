import { GenericProjectModel } from './generic-project.model'
import { ParticipantModel } from './participant.model'
import { CustomDatetimeModel } from './custom-datetime.model'

export interface GroupModel extends GenericProjectModel {
    name: string
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    members: ParticipantModel[]
}

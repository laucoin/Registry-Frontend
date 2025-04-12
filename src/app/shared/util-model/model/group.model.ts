import { GenericEventModel } from './generic-event.model'
import { ParticipantModel } from './participant.model'
import { CustomDatetimeModel } from './custom-datetime.model'

export interface GroupModel extends GenericEventModel {
    name: string
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    members: ParticipantModel[]
}

import { GenericEventModel } from './generic-event.model'
import { ParticipantModel } from './participant.model'

export interface GroupModel extends GenericEventModel {
    name: string
    begin: Date | undefined
    end: Date | undefined
    members: ParticipantModel[]
}

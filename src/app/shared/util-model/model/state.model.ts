import { EventProfileStateModel } from '../../../domains/event-profile/data/model/event-profile-state.model'
import { EventStateModel } from '../../../domains/event/data/model/event-state.model'
import { MovementStateModel } from '../../../domains/movement/data/model/movement-state.model'
import { ParticipantStateModel } from '../../../domains/participant/data/model/participant-state.model'
import { UserStateModel } from '../../../domains/user/data/model/user-state.model'
import { RegistryStateModel } from '../../util-common/model/registry-state.model'
import { GroupStateModel } from '../../../domains/group/data/model/group-state.model'

export interface StateModel {
    registry: RegistryStateModel
    user: UserStateModel
    event: EventStateModel
    eventProfile: EventProfileStateModel
    participant: ParticipantStateModel
    group: GroupStateModel
    movement: MovementStateModel
}

import { ParticipantPageParamsModel } from './participant-page-params.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'

export interface ParticipantStateModel {
    participants: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel>
    participant: ElementRequestInformationModel<ParticipantModel>
    searched: ParticipantModel[]
}

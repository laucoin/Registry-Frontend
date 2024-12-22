import { GroupPageParamsModel } from './group-page-params.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { SelectItem } from 'primeng/api'
import { ParticipantPageParamsModel } from '../../../participant/data/model/participant-page-params.model'

export interface GroupStateModel {
    groups: PageRequestInformationModel<GroupPageParamsModel, GroupModel>
    members: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel> & { groupId: string | undefined }
    group: ElementRequestInformationModel<GroupModel>
    searched: SelectItem<ParticipantModel>[]
}

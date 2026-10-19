import { GroupModel } from '@shared/models/model/group.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

export interface GroupStatusPageParamsModel {
    resetSearch: boolean
}

export type GroupMembersBlock = PageRequestInformationModel<GroupStatusPageParamsModel, ParticipantModel>

export interface GroupStatusStoreModel {
    mine: PageRequestInformationModel<GroupStatusPageParamsModel, GroupModel>
    groups: PageRequestInformationModel<GroupStatusPageParamsModel, GroupModel>
    members: Record<string, GroupMembersBlock>
}

import { GroupModel } from '@shared/models/model/group.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'

export interface GroupStatusPageParamsModel {
    resetSearch: boolean
}

export interface GroupStatusStoreModel {
    mine: PageRequestInformationModel<GroupStatusPageParamsModel, GroupModel>
    groups: PageRequestInformationModel<GroupStatusPageParamsModel, GroupModel>
}

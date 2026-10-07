import { GroupPageParamsModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { GroupModel } from '@shared/models/model/group.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { SelectItem } from 'primeng/api'
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'

export interface GroupStoreModel {
    groups: PageRequestInformationModel<GroupPageParamsModel, GroupModel>
    members: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel> & { groupId: string | undefined }
    _metadata: {
        searched: SelectItem<ParticipantModel>[]
        availabilities: SelectItem<boolean | undefined>[]
        visibilities: SelectItem<boolean | undefined>[]
    }
}

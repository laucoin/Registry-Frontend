import { GroupPageParamsModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { GroupModel } from '@shared/models/model/group.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'

export interface GroupStoreModel {
    groups: PageRequestInformationModel<GroupPageParamsModel, GroupModel>
    members: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel> & { groupId: string | undefined }
    metadata: {
        searched: SelectOptionModel<ParticipantModel>[]
        availabilities: SelectOptionModel<boolean | undefined>[]
        visibilities: SelectOptionModel<boolean | undefined>[]
    }
}

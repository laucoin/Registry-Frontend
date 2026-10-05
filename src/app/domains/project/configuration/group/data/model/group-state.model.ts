import { SelectItem } from 'primeng/api'
import {
    ElementRequestInformationModel,
} from '../../../../../../shared/util-model/model/element-request-information.model'
import { GroupModel } from '../../../../../../shared/util-model/model/group.model'
import { PageRequestInformationModel } from '../../../../../../shared/util-model/model/page-request-information.model'
import { ParticipantModel } from '../../../../../../shared/util-model/model/participant.model'
import { ParticipantPageParamsModel } from '../../../participant/data/model/participant-page-params.model'
import { GroupPageParamsModel } from './group-page-params.model'

export interface GroupStateModel {
	groups: PageRequestInformationModel<GroupPageParamsModel, GroupModel>
	members: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel> & { groupId: string | undefined }
	group: ElementRequestInformationModel<GroupModel>
	_metadata: {
		searched: SelectItem<ParticipantModel>[]
		availabilities: SelectItem<boolean | undefined>[]
		visibilities: SelectItem<boolean | undefined>[]
	}
}

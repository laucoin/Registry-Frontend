import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { GroupModel } from '@shared/models/model/group.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ParticipantTimelineModel } from '@shared/models/model/participant-timeline.model';
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';

export interface ParticipantStoreModel extends SectionErrorsState {
	participants: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel>;
	movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>;
	timeline: ElementRequestInformationModel<ParticipantTimelineModel>;
	metadata: {
		searchedUsers: UserModel[];
		searchedGroups: GroupModel[];
		presencesStatus: SelectOptionModel<PresenceStatusEnum | undefined>[];
		visibilities: SelectOptionModel<boolean | undefined>[];
	};
}

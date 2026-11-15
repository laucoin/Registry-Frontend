import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { ActivityModel } from '@shared/models/model/activity.model';
import { GenericModel } from '@shared/models/model/generic.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export interface MovementModel extends GenericModel {
	dateTime: Date;
	type: SelectOptionModel<MovementTypeEnum>;
	reason: MovementReasonModel | undefined;
	lastCommunicationDateTime: Date | undefined;
	activity: SelectOptionModel<ActivityModel> | undefined;
	contentType: ParticipantTypeEnum;
	content: MovementContentModel[];
}

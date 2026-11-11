import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { MovementParticipantsAndGroupsModel } from '@shared/models/model/movement-participants-and-groups.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

export interface MovementStoreModel extends SectionErrorsState {
	movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>;
	movementCommunications: PageRequestInformationModel<CommunicationPageParamsModel, CommunicationModel>;
	metadata: {
		types: SelectOptionModel<MovementTypeEnum | undefined>[];
		participantTypes: SelectOptionModel<ParticipantTypeEnum>[];
		searchedReasonsAndActivities: MovementReasonModel[];
		searchedParticipantsAndGroups: MovementParticipantsAndGroupsModel | undefined;
		searchedVehicles: SelectOptionModel<VehicleModel>[];
		visibilities: SelectOptionModel<boolean | undefined>[];
	};
}

import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model';
import { AlertModel } from '@shared/models/model/alert.model';
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';
import { ProjectStatusModel } from '@shared/models/model/project-status.model';
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model';
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model';

export interface SelectedProjectStoreModel extends SectionErrorsState {
	participantsStatus: ElementRequestInformationModel<ProjectStatusModel>;
	vehiclesStatus: ElementRequestInformationModel<VehicleStatusModel>;
	alerts: PageRequestInformationModel<AlertPageParamsModel, AlertModel>;
	overdue: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel>;
	overdueList: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel>;
	birthdays: ElementRequestInformationModel<ParticipantModel[]>;
	arrivals: ElementRequestInformationModel<PlannedMovementModel[]>;
	departures: ElementRequestInformationModel<PlannedMovementModel[]>;
	currentWithoutActivity: PageRequestInformationModel<MovementPageParamsModel, MovementModel>;
	currentWithActivity: PageRequestInformationModel<MovementPageParamsModel, MovementModel>;
}

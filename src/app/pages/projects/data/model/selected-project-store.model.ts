import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model';
import { AlertModel } from '@shared/models/model/alert.model';
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';
import { ProjectStatusModel } from '@shared/models/model/project-status.model';
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model';
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model';

export interface SelectedProjectStoreModel extends SectionErrorsState {
	status: {
		participants: {
			element: ProjectStatusModel | undefined;
			loading: boolean;
			error: NotificationModel | undefined;
		};
		vehicles: {
			element: VehicleStatusModel | undefined;
			loading: boolean;
			error: NotificationModel | undefined;
		};
	};
	alerts: PageRequestInformationModel<AlertPageParamsModel, AlertModel>;
	overdue: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel>;
	overdueList: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel>;
	birthdays: ElementRequestInformationModel<ParticipantModel[]>;
	arrivals: ElementRequestInformationModel<PlannedMovementModel[]>;
	departures: ElementRequestInformationModel<PlannedMovementModel[]>;
	isCurrent: {
		withoutActivity: PageRequestInformationModel<MovementPageParamsModel, MovementModel>;
		withActivity: PageRequestInformationModel<MovementPageParamsModel, MovementModel>;
	};
}

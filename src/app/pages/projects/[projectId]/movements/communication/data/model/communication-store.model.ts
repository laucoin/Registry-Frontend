import { AlertModel } from '@shared/models/model/alert.model';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model';

export interface CommunicationStoreModel extends SectionErrorsState {
	communication: ElementRequestInformationModel<CommunicationModel>;
	metadata: {
		searchedMovements: MovementModel[];
		searchedAlerts: AlertModel[];
	};
}

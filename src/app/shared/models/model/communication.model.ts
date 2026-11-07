import { AlertModel } from '@shared/models/model/alert.model';
import { GenericModel } from '@shared/models/model/generic.model';
import { MovementModel } from '@shared/models/model/movement.model';

export interface CommunicationModel extends GenericModel {
	dateTime: Date;
	message: string | undefined;
	movement: MovementModel | undefined;
	alert: AlertModel | undefined;
}

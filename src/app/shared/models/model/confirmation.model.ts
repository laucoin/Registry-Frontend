import { Observable } from 'rxjs';

import { SeverityEnum } from '@shared/models/enumeration/severity.enum';

export interface ConfirmationModel {
	header: string;
	message: string;
	acceptSeverity: SeverityEnum;
	accept: () => Observable<unknown>;
	phrase?: string;
}

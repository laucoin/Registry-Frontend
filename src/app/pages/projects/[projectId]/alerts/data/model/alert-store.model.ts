import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model';
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { AlertCriticalityMetadataModel } from '@shared/models/model/alert-criticality-metadata.model';
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model';
import { AlertStatisticsModel } from '@shared/models/model/alert-statistics.model';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export interface AlertStoreModel extends SectionErrorsState {
	alerts: PageRequestInformationModel<AlertPageParamsModel, AlertModel>;
	communications: PageRequestInformationModel<CommunicationPageParamsModel, CommunicationModel>;
	statistics: ElementRequestInformationModel<AlertStatisticsModel>;
	metadata: {
		status: SelectOptionModel<AlertStatusEnum | undefined>[];
		criticality: AlertCriticalityMetadataModel | undefined;
		visibilities: SelectOptionModel<boolean | undefined>[];
	};
}

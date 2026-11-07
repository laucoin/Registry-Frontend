import { ActivityPageParamsModel } from '@pages/projects/[projectId]/configuration/activities/data/model/activity-page-params.model';
import { ActivityModel } from '@shared/models/model/activity.model';
import { ActivityStatisticsModel } from '@shared/models/model/activity-statistics.model';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export interface ActivityStoreModel extends SectionErrorsState {
	activities: PageRequestInformationModel<ActivityPageParamsModel, ActivityModel>;
	movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>;
	statistics: ElementRequestInformationModel<ActivityStatisticsModel>;
	metadata: {
		availabilities: SelectOptionModel<boolean | undefined>[];
		visibilities: SelectOptionModel<boolean | undefined>[];
	};
}

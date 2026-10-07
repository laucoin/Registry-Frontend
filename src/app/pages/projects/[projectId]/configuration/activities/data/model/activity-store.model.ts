import { ActivityPageParamsModel } from '@pages/projects/[projectId]/configuration/activities/data/model/activity-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ActivityModel } from '@shared/models/model/activity.model'
import { SelectItem } from 'primeng/api'

export interface ActivityStoreModel {
    activities: PageRequestInformationModel<ActivityPageParamsModel, ActivityModel>
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    metadata: {
        availabilities: SelectItem<boolean | undefined>[],
        visibilities: SelectItem<boolean | undefined>[],
    }
}

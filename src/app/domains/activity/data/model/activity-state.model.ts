import { ActivityPageParamsModel } from './activity-page-params.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { MovementPageParamsModel } from '../../../../shared/util-model/model/movement-page-params.model'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { ActivityModel } from '../../../../shared/util-model/model/activity.model'
import { SelectItem } from 'primeng/api'

export interface ActivityStateModel {
    activities: PageRequestInformationModel<ActivityPageParamsModel, ActivityModel>
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    activity: ElementRequestInformationModel<ActivityModel>
    _metadata: {
        availabilities: SelectItem<boolean | undefined>[],
        visibilities: SelectItem<boolean | undefined>[],
    }
}

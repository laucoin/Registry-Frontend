import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ToastMessageOptions } from 'primeng/api'
import { ProjectStatusModel } from './project-status.model'
import { VehicleStatusModel } from './vehicle-status.model'
import { MovementPageParamsModel } from '../../../../shared/util-model/model/movement-page-params.model'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { AlertModel } from '../../../../shared/util-model/model/alert.model'
import { AlertPageParamsModel } from '../../../../shared/util-model/model/alert-page-params.model'

export interface SelectedProjectStateModel {
    status: {
        participants: {
            element: ProjectStatusModel | undefined
            loading: boolean
            error: ToastMessageOptions | undefined
        },
        vehicles: {
            element: VehicleStatusModel | undefined
            loading: boolean
            error: ToastMessageOptions | undefined
        }
    }
    alerts: PageRequestInformationModel<AlertPageParamsModel, AlertModel>
    birthdays: ParticipantModel[]
    currentMovements: {
        withoutActivity: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
        withActivity: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    }
}

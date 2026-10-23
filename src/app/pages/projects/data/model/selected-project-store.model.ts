import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ToastMessageOptions } from 'primeng/api'
import { ProjectStatusModel } from '@shared/models/model/project-status.model'
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model'

export interface SelectedProjectStoreModel {
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

import { ToastMessageOptions } from 'primeng/api'
import { AlertPageParamsModel } from '../../../../shared/util-model/model/alert-page-params.model'
import { AlertModel } from '../../../../shared/util-model/model/alert.model'
import { MovementPageParamsModel } from '../../../../shared/util-model/model/movement-page-params.model'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { ProjectStatusModel } from './project-status.model'
import { VehicleStatusModel } from './vehicle-status.model'

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

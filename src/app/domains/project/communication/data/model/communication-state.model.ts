import { SelectItem } from 'primeng/api'
import { AlertModel } from '../../../../../shared/util-model/model/alert.model'
import {
    ElementRequestInformationModel,
} from '../../../../../shared/util-model/model/element-request-information.model'
import { MovementModel } from '../../../../../shared/util-model/model/movement.model'
import { PageRequestInformationModel } from '../../../../../shared/util-model/model/page-request-information.model'
import { CommunicationPageParamsModel } from './communication-page-params.model'
import { CommunicationModel } from './communication.model'

export interface CommunicationStateModel {
	communications: PageRequestInformationModel<CommunicationPageParamsModel, CommunicationModel>
	communication: ElementRequestInformationModel<CommunicationModel>
	_metadata: {
		searchedMovements: SelectItem<MovementModel>[]
		searchedAlerts: SelectItem<AlertModel>[]
		visibilities: SelectItem<boolean | undefined>[],
	}
}

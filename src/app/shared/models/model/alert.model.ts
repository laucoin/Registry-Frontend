import { OptionalProjectModel } from '@shared/models/model/generic-project.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'

export interface AlertModel extends OptionalProjectModel {
    dateTime: Date
    title: string
    status: SelectOptionModel<AlertStatusEnum>
    communications: CommunicationModel[] | undefined
}

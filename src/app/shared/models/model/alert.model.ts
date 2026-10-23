import { OptionalProjectModel } from '@shared/models/model/generic-project.model'
import { SelectItem } from 'primeng/api'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'

export interface AlertModel extends OptionalProjectModel {
    dateTime: Date
    title: string
    status: SelectItem<AlertStatusEnum>
    communications: CommunicationModel[] | undefined
}

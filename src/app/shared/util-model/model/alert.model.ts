import { GenericProjectModel } from './generic-project.model'
import { SelectItem } from 'primeng/api'
import { CommunicationModel } from '../../../domains/project/communication/data/model/communication.model'
import { AlertStatusEnum } from '../enumeration/alert-status.enum'

export interface AlertModel extends GenericProjectModel {
    dateTime: Date
    title: string
    status: SelectItem<AlertStatusEnum>
    communications: CommunicationModel[] | undefined
}

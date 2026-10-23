import { GenericProjectModel } from '@shared/models/model/generic-project.model'
import { SelectItem } from 'primeng/api'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'

export interface AlertModel extends GenericProjectModel {
    dateTime: Date
    title: string
    status: SelectItem<AlertStatusEnum>
    communications: CommunicationModel[] | undefined
}

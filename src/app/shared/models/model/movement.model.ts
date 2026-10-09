import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { GenericProjectModel } from '@shared/models/model/generic-project.model'
import { SelectItem } from 'primeng/api'
import { ActivityModel } from '@shared/models/model/activity.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'

export interface MovementModel extends GenericProjectModel {
    dateTime: Date
    type: SelectItem<MovementTypeEnum>
    reason: MovementReasonModel | undefined
    activity: SelectItem<ActivityModel> | undefined
    contentType: ParticipantTypeEnum
    content: MovementContentModel[]
}

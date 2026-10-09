import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { OptionalProjectModel } from '@shared/models/model/generic-project.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ActivityModel } from '@shared/models/model/activity.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'

export interface MovementModel extends OptionalProjectModel {
    dateTime: Date
    type: SelectOptionModel<MovementTypeEnum>
    reason: MovementReasonModel | undefined
    activity: SelectOptionModel<ActivityModel> | undefined
    contentType: ParticipantTypeEnum
    content: MovementContentModel[]
}

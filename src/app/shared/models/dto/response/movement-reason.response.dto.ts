import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'

export interface MovementReasonResponseDto extends SelectOptionModel<string> {
    type?: MovementTypeEnum
    kind: 'REASON' | 'ACTIVITY'
}

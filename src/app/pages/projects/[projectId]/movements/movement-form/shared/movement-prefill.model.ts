import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'

/**
 * Purpose: What a movement form starts with when it is opened from the project home.
 * Scope: The type, the reason and the participants known from a planned movement or a presence to regularize.
 * Limits: Carries no date; the form keeps the current time.
 */
export interface MovementPrefillModel {
    type: MovementTypeEnum
    reason: MovementReasonModel | undefined
    content: MovementContentModel[]
}

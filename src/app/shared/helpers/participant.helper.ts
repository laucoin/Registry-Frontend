import { ParticipantModel } from '@shared/models/model/participant.model'
import { SelectItem } from 'primeng/api'

/**
 * Purpose: Builds select items for participants.
 * Scope: Pure mapping from a participant to a select item.
 * Limits: No state and no translation.
 */
export class ParticipantHelper {
    public static toSelectItem (participant: ParticipantModel): SelectItem<ParticipantModel> {
        return {
            label: `${participant.firstName} ${participant.lastName}`,
            value: participant,
        }
    }
}

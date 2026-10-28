import { ParticipantModel } from '@shared/models/model/participant.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

/**
 * Purpose: Construit les select items des participants.
 * Scope: Mapping pur d'un participant vers un select item.
 * Limits: Aucun état et aucune traduction.
 */
export class ParticipantHelper {
    public static toSelectItem (participant: ParticipantModel): SelectOptionModel<ParticipantModel> {
        return {
            label: `${participant.firstName} ${participant.lastName}`,
            value: participant,
        }
    }
}

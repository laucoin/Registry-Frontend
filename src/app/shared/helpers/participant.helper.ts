import { ParticipantModel } from '@shared/models/model/participant.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

/**
 * Objectif: Construit les select items des participants.
 * Périmètre: Mapping pur d'un participant vers un select item.
 * Limites: Aucun état et aucune traduction.
 */
export const ParticipantHelper = {
	toSelectItem(participant: ParticipantModel): SelectOptionModel<ParticipantModel> {
		return {
			label: `${participant.firstName} ${participant.lastName}`,
			value: participant,
		};
	},
} as const;

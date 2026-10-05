import { SelectItem } from 'primeng/api'
import { ParticipantModel } from '../../util-model/model/participant.model'

export class ParticipantUtil {
	public static toSelectItem(participant: ParticipantModel): SelectItem<ParticipantModel> {
		return {
			label: `${participant.firstName} ${participant.lastName}`,
			value: participant,
		}
	}
}

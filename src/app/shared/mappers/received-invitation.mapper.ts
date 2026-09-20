import { StringHelper } from '@shared/helpers/string.helper';
import { ReceivedInvitationModel } from '@shared/models/received-invitation.model';
import { GenericProjectReaderResponse } from '@shared/mappers/common/generic-project-reader.response';
import { LabelResponse } from '@shared/mappers/common/label.mapper';

interface PartialUserResponse {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
}

export interface ReceivedInvitationResponse extends GenericProjectReaderResponse {
	role: LabelResponse | null;
	creation: { user: PartialUserResponse | null } | null;
}

export class ReceivedInvitationMapper {
	public static toModel(response: ReceivedInvitationResponse): ReceivedInvitationModel {
		const inviter: PartialUserResponse | null = response.creation?.user ?? null;
		const inviterName: string =
			[inviter?.firstName, inviter?.lastName].filter(Boolean).join(StringHelper.SPACE) || (inviter?.email ?? '');

		return {
			id: response.id,
			projectName: response.project.name,
			inviterName,
			roleLabel: response.role?.label ?? '',
		};
	}
}

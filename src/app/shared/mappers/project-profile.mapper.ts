import { DateTimeHelper } from '@shared/helpers/date-time.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { GenericProjectReaderResponse } from '@shared/mappers/common/generic-project-reader.response';
import { AvailabilityStatusValue, LabelMapper, LabelResponse } from '@shared/mappers/common/label.mapper';
import { ProjectMapper } from '@shared/mappers/project.mapper';
import { ProjectProfileModel } from '@shared/models/project-profile.model';
import { ProjectModel } from '@shared/models/project.model';

interface PartialUserResponse {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
}

/**
 * Purpose: Raw shape of every `/api/v2/users/profiles` query response — the backend only ever populates
 * the fields relevant to the query that produced it, hence every field beyond `id`/`project.name` is
 * optional (not just nullable).
 * Scope: One response type for ProfilesApi.findProfiles and findProfilesRequiringAttention. `availabilityStatus`
 * is this profile's own access availability, distinct from `project.status` (the project's own availability).
 */
export interface ProjectProfileResponse extends GenericProjectReaderResponse {
	favorite?: boolean;
	lastEdition?: { dateTime: string } | null;
	role?: LabelResponse | null;
	availabilityStatus?: LabelResponse<AvailabilityStatusValue> | null;
	creation?: { user: PartialUserResponse | null } | null;
}

export class ProjectProfileMapper {
	public static toModel(response: ProjectProfileResponse): ProjectProfileModel {
		const inviter: PartialUserResponse | null = response.creation?.user ?? null;
		const project: ProjectModel = ProjectMapper.toModel(response.project);

		return {
			id: response.id,
			name: project.name,
			availability:
				response.availabilityStatus !== undefined
					? LabelMapper.toAvailability(response.availabilityStatus)
					: undefined,
			isFavorite: response.favorite,
			dateRangeLabel: project.dateRangeLabel,
			lastActivityLabel: response.lastEdition
				? DateTimeHelper.formatDate(response.lastEdition.dateTime)
				: undefined,
			endDateLabel: project.endDateLabel,
			moduleLabels: project.moduleLabels,
			inviterName: response.creation !== undefined ? ProjectProfileMapper._inviterName(inviter) : undefined,
			roleLabel: response.role !== undefined ? (response.role?.label ?? '') : undefined,
			counts: project.counts,
		};
	}

	private static _inviterName(inviter: PartialUserResponse | null): string {
		return (
			[inviter?.firstName, inviter?.lastName].filter(Boolean).join(StringHelper.SPACE) ||
			(inviter?.email ?? '')
		);
	}
}

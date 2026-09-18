import { DateTimeHelper } from '@shared/helpers/date-time.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { GenericProjectReaderResponse } from '@shared/mappers/common/generic-project-reader.response';
import { AvailabilityStatusValue, LabelMapper, LabelResponse } from '@shared/mappers/common/label.mapper';
import { CustomDateTimeResponse } from '@shared/mappers/common/custom-date-time.response';
import { ProjectCountsMapper, ProjectCountsResponse } from '@shared/mappers/project-counts.mapper';
import { ProjectProfileModel } from '@shared/models/project-profile.model';

interface PartialUserResponse {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
}

/**
 * Purpose: Raw shape of every `/api/v2/users/profiles` query response — the backend only ever populates
 * the fields relevant to the query that produced it, hence every field beyond `id`/`project.name` is
 * optional (not just nullable).
 * Scope: One response type for ProfilesApi.findProfiles and findProfilesRequiringAttention.
 */
export interface ProjectProfileResponse extends GenericProjectReaderResponse {
	favorite?: boolean;
	lastEdition?: { dateTime: string } | null;
	role?: LabelResponse | null;
	creation?: { user: PartialUserResponse | null } | null;
	project: {
		name: string;
		status?: LabelResponse<AvailabilityStatusValue> | null;
		begin?: CustomDateTimeResponse | null;
		end?: CustomDateTimeResponse | null;
		options?: LabelResponse[];
		counts?: ProjectCountsResponse | null;
	};
}

export class ProjectProfileMapper {
	public static toModel(response: ProjectProfileResponse): ProjectProfileModel {
		const inviter: PartialUserResponse | null = response.creation?.user ?? null;

		return {
			id: response.id,
			name: response.project.name,
			availability:
				response.project.status !== undefined
					? LabelMapper.toAvailability(response.project.status)
					: undefined,
			isFavorite: response.favorite,
			dateRangeLabel:
				response.project.begin || response.project.end
					? DateTimeHelper.formatDateRange(response.project.begin ?? null, response.project.end ?? null)
					: undefined,
			lastActivityLabel: response.lastEdition
				? DateTimeHelper.formatDate(response.lastEdition.dateTime)
				: undefined,
			endDateLabel: response.project.end ? DateTimeHelper.formatDate(response.project.end.date) : undefined,
			moduleLabels: response.project.options ? LabelMapper.toLabels(response.project.options) : undefined,
			inviterName: response.creation !== undefined ? ProjectProfileMapper._inviterName(inviter) : undefined,
			roleLabel: response.role !== undefined ? (response.role?.label ?? '') : undefined,
			counts:
				response.project.counts !== undefined
					? ProjectCountsMapper.toModel(response.project.counts)
					: undefined,
		};
	}

	private static _inviterName(inviter: PartialUserResponse | null): string {
		return (
			[inviter?.firstName, inviter?.lastName].filter(Boolean).join(StringHelper.SPACE) ||
			(inviter?.email ?? '')
		);
	}
}

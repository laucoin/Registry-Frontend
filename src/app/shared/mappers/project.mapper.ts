import { DateTimeHelper } from '@shared/helpers/date-time.helper';
import { AvailabilityStatusValue, LabelMapper, LabelResponse } from '@shared/mappers/common/label.mapper';
import { CustomDateTimeResponse } from '@shared/mappers/common/custom-date-time.response';
import { ProjectCountsMapper, ProjectCountsResponse } from '@shared/mappers/project-counts.mapper';
import { ProjectModel } from '@shared/models/project.model';

/**
 * Purpose: Raw shape of the `project` object nested in every `/api/v2/users/profiles` response,
 * mirroring the backend's ProjectReaderDto. `status` is the project's own availability (is it within
 * its begin/end window) — not to be confused with a profile's own top-level `availabilityStatus`.
 */
export interface ProjectResponse {
	id: string;
	name: string;
	status?: LabelResponse<AvailabilityStatusValue> | null;
	begin?: CustomDateTimeResponse | null;
	end?: CustomDateTimeResponse | null;
	options?: LabelResponse[];
	favorite?: boolean;
	counts?: ProjectCountsResponse | null;
}

export class ProjectMapper {
	public static toModel(response: ProjectResponse): ProjectModel {
		return {
			id: response.id,
			name: response.name,
			availability: response.status !== undefined ? LabelMapper.toAvailability(response.status) : undefined,
			isFavorite: response.favorite,
			dateRangeLabel:
				response.begin || response.end
					? DateTimeHelper.formatDateRange(response.begin ?? null, response.end ?? null)
					: undefined,
			endDateLabel: response.end ? DateTimeHelper.formatDate(response.end.date) : undefined,
			moduleLabels: response.options ? LabelMapper.toLabels(response.options) : undefined,
			counts: response.counts !== undefined ? ProjectCountsMapper.toModel(response.counts) : undefined,
		};
	}
}

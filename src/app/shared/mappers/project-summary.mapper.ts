import { DateTimeHelper } from '@shared/helpers/date-time.helper';
import { ProjectSummaryModel } from '@shared/models/project-summary.model';
import { GenericProjectReaderResponse } from '@shared/mappers/common/generic-project-reader.response';
import { LabelMapper, LabelResponse } from '@shared/mappers/common/label.mapper';
import { CustomDateTimeResponse } from '@shared/mappers/common/custom-date-time.response';

export interface ProjectSummaryResponse extends GenericProjectReaderResponse {
	favorite: boolean;
	lastEdition: { dateTime: string } | null;
	project: {
		name: string;
		status: LabelResponse | null;
		begin: CustomDateTimeResponse | null;
		end: CustomDateTimeResponse | null;
	};
}

export class ProjectSummaryMapper {
	public static toModel(response: ProjectSummaryResponse): ProjectSummaryModel {
		return {
			id: response.id,
			name: response.project.name,
			availabilityStatus: LabelMapper.toAvailabilityStatus(response.project.status),
			availabilityLabel: LabelMapper.toAvailabilityLabel(response.project.status),
			isFavorite: response.favorite,
			dateRangeLabel: DateTimeHelper.formatDateRange(response.project.begin, response.project.end),
			lastActivityLabel: DateTimeHelper.formatDate(response.lastEdition?.dateTime),
		};
	}
}

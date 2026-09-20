import { DateTimeHelper } from '@shared/helpers/date-time.helper';
import { UpcomingProjectModel } from '@shared/models/upcoming-project.model';
import { GenericProjectReaderResponse } from '@shared/mappers/common/generic-project-reader.response';
import { LabelMapper, LabelResponse } from '@shared/mappers/common/label.mapper';
import { CustomDateTimeResponse } from '@shared/mappers/common/custom-date-time.response';

export interface UpcomingProjectResponse extends GenericProjectReaderResponse {
	project: {
		name: string;
		begin: CustomDateTimeResponse | null;
		end: CustomDateTimeResponse | null;
		options: LabelResponse[];
	};
}

export class UpcomingProjectMapper {
	public static toModel(response: UpcomingProjectResponse): UpcomingProjectModel {
		return {
			id: response.id,
			name: response.project.name,
			dateRangeLabel: DateTimeHelper.formatDateRange(response.project.begin, response.project.end),
			moduleLabels: LabelMapper.toLabels(response.project.options),
		};
	}
}

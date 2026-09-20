import { DateTimeHelper } from '@shared/helpers/date-time.helper';
import { WatchedProjectModel } from '@shared/models/watched-project.model';
import { GenericProjectReaderResponse } from '@shared/mappers/common/generic-project-reader.response';
import { LabelMapper, LabelResponse } from '@shared/mappers/common/label.mapper';
import { CustomDateTimeResponse } from '@shared/mappers/common/custom-date-time.response';

export interface WatchedProjectResponse extends GenericProjectReaderResponse {
	project: {
		name: string;
		end: CustomDateTimeResponse | null;
		options: LabelResponse[];
	};
}

export class WatchedProjectMapper {
	public static toModel(response: WatchedProjectResponse): WatchedProjectModel {
		return {
			id: response.id,
			name: response.project.name,
			endDateLabel: DateTimeHelper.formatDate(response.project.end?.date),
			moduleLabels: LabelMapper.toLabels(response.project.options),
		};
	}
}

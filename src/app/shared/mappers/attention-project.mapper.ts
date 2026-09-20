import { AttentionProjectModel } from '@shared/models/attention-project.model';
import { ProjectCountsMapper, ProjectCountsResponse } from '@shared/mappers/project-counts.mapper';
import { GenericProjectReaderResponse } from '@shared/mappers/common/generic-project-reader.response';
import { LabelMapper, LabelResponse } from '@shared/mappers/common/label.mapper';

export interface AttentionProjectResponse extends GenericProjectReaderResponse {
	project: {
		name: string;
		status: LabelResponse | null;
		counts: ProjectCountsResponse | null;
	};
}

export class AttentionProjectMapper {
	public static toModel(response: AttentionProjectResponse): AttentionProjectModel {
		return {
			id: response.id,
			name: response.project.name,
			availabilityStatus: LabelMapper.toAvailabilityStatus(response.project.status),
			availabilityLabel: LabelMapper.toAvailabilityLabel(response.project.status),
			counts: ProjectCountsMapper.toModel(response.project.counts),
		};
	}
}

import { ProjectAvailabilityStatusModel } from '@shared/models/project-summary.model';
import { ProjectCountsModel } from '@shared/models/project-counts.model';

export interface AttentionProjectModel {
	id: string;
	name: string;
	availabilityStatus: ProjectAvailabilityStatusModel;
	availabilityLabel: string;
	counts: ProjectCountsModel;
}

import { ProjectCountsModel } from '@shared/models/project-counts.model';

export type ProjectAvailabilityStatusModel = 'available' | 'unavailable';

export interface ProjectAvailabilityModel {
	status: ProjectAvailabilityStatusModel;
	label: string;
}

/**
 * Purpose: A project on its own — the nested `project` payload backing every `/api/v2/users/profiles`
 * response, and the shape of every `/api/v2/projects` response, mirroring the backend's ProjectReaderDto.
 * Scope: `availability` here is the project's own status (is it within its begin/end window), distinct
 * from a profile's own `availabilityStatus` (is that user's access to it currently active). `isFavorite`
 * reflects the caller's own Profile on this project, when one exists.
 */
export interface ProjectModel {
	id: string;
	name: string;
	availability?: ProjectAvailabilityModel;
	isFavorite?: boolean;
	dateRangeLabel?: string;
	endDateLabel?: string;
	moduleLabels?: string[];
	counts?: ProjectCountsModel;
}

export type ProjectAvailabilityStatusModel = 'available' | 'unavailable';

export interface ProjectSummaryModel {
	id: string;
	name: string;
	availabilityStatus: ProjectAvailabilityStatusModel;
	availabilityLabel: string;
	isFavorite: boolean;
	dateRangeLabel: string;
	lastActivityLabel: string;
}

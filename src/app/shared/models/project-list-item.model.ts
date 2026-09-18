export type ProjectStatusModel = 'inProgress' | 'inPreparation' | 'completed' | 'archived';

export interface ProjectListItemModel {
	id: string;
	code: string;
	name: string;
	status: ProjectStatusModel;
	isFavorite: boolean;
	participantsCount: number;
	secondaryStatLabel: string | undefined;
	dateRangeLabel: string;
	activityLabel: string;
	moduleLabels: string[];
}

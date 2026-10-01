import { ProjectCountsModel } from '@shared/models/project-counts.model';

export interface ProjectCountsResponse {
	participants: number;
	vehicles: number;
	groups: number;
	activities: number;
	profiles: number;
	ongoingAlerts: number;
}

export class ProjectCountsMapper {
	public static toModel(response: ProjectCountsResponse | null | undefined): ProjectCountsModel {
		return {
			participants: response?.participants ?? 0,
			vehicles: response?.vehicles ?? 0,
			groups: response?.groups ?? 0,
			activities: response?.activities ?? 0,
			profiles: response?.profiles ?? 0,
			ongoingAlerts: response?.ongoingAlerts ?? 0,
		};
	}
}

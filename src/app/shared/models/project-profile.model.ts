import { ProjectCountsModel } from '@shared/models/project-counts.model';

export type ProjectAvailabilityStatusModel = 'available' | 'unavailable';

export interface ProjectAvailabilityModel {
	status: ProjectAvailabilityStatusModel;
	label: string;
}

/**
 * Purpose: Single model for every `/api/v2/users/profiles` query the home page makes (favorites, in
 * progress, upcoming, received invitations, attention) — the backend returns a different field subset
 * per query, so every field beyond `id`/`name` is optional here.
 * Scope: A consumer only reads the fields that its specific query is known to populate (e.g. the
 * favorites widget reads `isFavorite`/`dateRangeLabel`, never `roleLabel`).
 * Limits: TypeScript cannot statically guarantee which fields a given array element has — that guarantee
 * lived in the five separate models this replaces (ProjectSummaryModel, WatchedProjectModel, ...).
 */
export interface ProjectProfileModel {
	id: string;
	name: string;
	availability?: ProjectAvailabilityModel;
	isFavorite?: boolean;
	dateRangeLabel?: string;
	lastActivityLabel?: string;
	endDateLabel?: string;
	moduleLabels?: string[];
	inviterName?: string;
	roleLabel?: string;
	counts?: ProjectCountsModel;
}

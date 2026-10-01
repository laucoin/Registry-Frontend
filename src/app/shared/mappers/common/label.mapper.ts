import { ProjectAvailabilityModel } from '@shared/models/project.model';

// Generic over the backend's enum-backed `value`, mirroring the backend's own LabelResponse<T> DTO —
// defaults to `string` for call sites (role, module options) that only ever display `.label` and never
// branch on `.value`. A call site that DOES branch on `.value` (toAvailability below) should
// instantiate this with the specific literal union instead, so a backend rename/typo becomes a compile
// error instead of silently turning a branch into dead code.
export interface LabelResponse<T extends string = string> {
	value: T | null;
	label: string;
}

export type AvailabilityStatusValue = 'AVAILABLE' | 'UNAVAILABLE';

export class LabelMapper {
	public static toAvailability(label: LabelResponse<AvailabilityStatusValue> | null): ProjectAvailabilityModel {
		return {
			status: label?.value === 'AVAILABLE' ? 'available' : 'unavailable',
			label: label?.label ?? '',
		};
	}

	public static toLabels(labels: LabelResponse[] | null): string[] {
		return labels?.map((label: LabelResponse) => label.label) ?? [];
	}
}

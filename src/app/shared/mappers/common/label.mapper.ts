import { ProjectAvailabilityStatusModel } from '@shared/models/project-summary.model';

export interface LabelResponse {
	value: string | null;
	label: string;
}

export class LabelMapper {
	public static toAvailabilityStatus(label: LabelResponse | null): ProjectAvailabilityStatusModel {
		return label?.value === 'AVAILABLE' ? 'available' : 'unavailable';
	}

	public static toAvailabilityLabel(label: LabelResponse | null): string {
		return label?.label ?? '';
	}

	public static toLabels(labels: LabelResponse[] | null): string[] {
		return labels?.map((label: LabelResponse) => label.label) ?? [];
	}
}

import type { SgdfStatusVariant } from '@sgdf/ui';

export interface MonitoringRowModel {
	id: string;
	title: string;
	subtitle: string | undefined;
	statusLabel: string | undefined;
	statusVariant: SgdfStatusVariant;
	icon: string;
	overdue?: boolean;
}

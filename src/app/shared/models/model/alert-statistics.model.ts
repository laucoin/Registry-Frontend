export interface AlertStatisticsModel {
	resolvedCount: number;
	canceledCount: number;
	averageResolutionSeconds: number | undefined;
	realAlertRate: number | undefined;
}

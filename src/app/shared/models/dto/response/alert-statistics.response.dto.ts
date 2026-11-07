export interface AlertStatisticsResponseDto {
	resolvedCount: number;
	canceledCount: number;
	averageResolutionSeconds: number | null;
	realAlertRate: number | null;
}

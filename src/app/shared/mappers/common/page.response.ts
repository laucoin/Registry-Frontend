export interface PageResponse<T> {
	pageNumber: number;
	pageSize: number;
	totalPages: number;
	totalElements: number;
	content: T[];
	lastRefresh: string;
}

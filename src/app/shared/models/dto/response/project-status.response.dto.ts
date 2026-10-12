export interface ProjectStatusResponseDto {
    registered: { presentMinors: number, presentMajors: number, absentMinors: number, absentMajors: number }
    guests: number
    lastRefresh: Date
}

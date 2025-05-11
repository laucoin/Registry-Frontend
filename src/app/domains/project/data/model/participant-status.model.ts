export interface ParticipantStatusModel {
    registered: {
        presentMinors: number,
        presentMajors: number,
        absentMinors: number,
        absentMajors: number,
    },
    guests: number
}

export interface ParticipantDto {
    firstName: string
    lastName: string
    birthday: string
    userId: string
    groupIds: string[]
    begin: Date | undefined
    end: Date | undefined
}

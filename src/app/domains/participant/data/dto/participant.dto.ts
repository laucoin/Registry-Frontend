export interface ParticipantDto {
    firstName: string
    lastName: string
    birthday: string
    userId: string | undefined
    groupIds: string[]
    begin: Date | undefined
    end: Date | undefined
}

export interface EventProfilesDto {
    userIds: string[],
    role: string,
    startAccess: Date | undefined,
    endAccess: Date | undefined,
}

import { GuestDto } from '@pages/projects/[projectId]/movements/data/dto/guest.dto'

export interface GuestMovementDto {
    dateTime: Date
    type: string
    reason: string | undefined
    content: { participantId: string }[]
    guests: GuestDto[]
}

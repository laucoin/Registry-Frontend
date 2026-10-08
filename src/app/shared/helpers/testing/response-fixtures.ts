import { ActivityResponseDto } from '@shared/models/dto/response/activity.response.dto'
import { AlertResponseDto } from '@shared/models/dto/response/alert.response.dto'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { ProjectResponseDto } from '@shared/models/dto/response/project.response.dto'
import { ProjectProfileResponseDto } from '@shared/models/dto/response/project-profile.response.dto'
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto'
import { VehicleResponseDto } from '@shared/models/dto/response/vehicle.response.dto'

export const WHEN: Date = new Date( '2026-01-05T10:00:00Z' )

export const HISTORY: { dateTime: Date, user: { id: string, firstName: string, lastName: string, email: string } } = {
    dateTime: WHEN,
    user: { id: 'u0', firstName: 'Ada', lastName: 'L', email: 'ada@x.test' },
}

const GENERIC: { id: string, visible: boolean, creation: typeof HISTORY, lastEdition: typeof HISTORY } = {
    id: 'e1', visible: true, creation: HISTORY, lastEdition: HISTORY,
}

export const USER_DTO: UserResponseDto = {
    ...GENERIC, id: 'u1', firstName: 'Grace', lastName: 'H', email: 'g@x.test', role: { label: 'Admin', value: 'ADMIN' }, birthday: WHEN, lastLogin: WHEN, purged: false,
}

export const PROJECT_DTO: ProjectResponseDto = {
    ...GENERIC, id: 'p1', name: 'Camp', status: undefined, begin: { date: '2026-01-01', time: undefined }, end: undefined, options: [],
}

export const PARTICIPANT_DTO: ParticipantResponseDto = {
    ...GENERIC, id: 'pa1', project: PROJECT_DTO, firstName: 'A', lastName: 'B', birthday: '2010-01-01', major: false,
    type: { label: 'Registered', value: 'REGISTERED' as never }, groups: undefined, status: { label: 'In', value: 'IN' as never },
    startAvailability: undefined, endAvailability: undefined, user: USER_DTO, purged: false,
}

export const GROUP_DTO: GroupResponseDto = {
    ...GENERIC, id: 'g1', project: PROJECT_DTO, name: 'Wolves', status: undefined, startAvailability: undefined, endAvailability: undefined,
    membersCount: 1, insideMembersCount: 1, outsideMembersCount: 0, members: undefined,
}

export const VEHICLE_DTO: VehicleResponseDto = {
    ...GENERIC, id: 'v1', project: PROJECT_DTO, licensePlate: 'AB-123', brand: 'Ford', model: 'T',
    status: { label: 'In', value: 'IN' as never }, startAvailability: undefined, endAvailability: undefined,
}

export const ACTIVITY_DTO: ActivityResponseDto = {
    ...GENERIC, id: 'a1', project: PROJECT_DTO, name: 'Hike', status: undefined, description: 'd', duration: { label: '2h', value: 'PT2H' },
    allowedParticipants: { lower: 1, upper: 5 }, startAvailability: undefined, endAvailability: undefined,
}

export const MOVEMENT_DTO: MovementResponseDto = {
    ...GENERIC, id: 'm1', project: PROJECT_DTO, dateTime: WHEN, type: { label: 'In', value: 'IN' as never },
    reason: { label: 'Arrival', value: 'r1', kind: 'REASON' }, activity: undefined, contentType: 'REGISTERED' as never,
    content: [ { poolName: 'car 1', participant: PARTICIPANT_DTO, vehicle: VEHICLE_DTO } ],
}

export const COMMUNICATION_DTO: CommunicationResponseDto = {
    ...GENERIC, id: 'c1', project: PROJECT_DTO, dateTime: WHEN, message: 'hello', movement: MOVEMENT_DTO, alert: undefined,
}

export const ALERT_DTO: AlertResponseDto = {
    ...GENERIC, id: 'al1', project: PROJECT_DTO, dateTime: WHEN, title: 'Fire', status: { label: 'In progress', value: 'IN_PROGRESS' as never },
    communications: [ COMMUNICATION_DTO ],
}

export const PROFILE_DTO: ProjectProfileResponseDto = {
    ...GENERIC, id: 'pp1', project: PROJECT_DTO, user: USER_DTO, role: { label: 'Chief', value: 'CHIEF' },
    availabilityStatus: { label: 'x', value: 'AVAILABLE' as never }, status: { label: 'y', value: 'ACCEPTED' as never },
    startAccess: undefined, endAccess: undefined,
}

export function pageDto<T> (content: T[]): PageResponseDto<T> {
    return { pageNumber: 0, pageSize: 10, totalElements: content.length, totalPages: 1, content, lastRefresh: WHEN }
}

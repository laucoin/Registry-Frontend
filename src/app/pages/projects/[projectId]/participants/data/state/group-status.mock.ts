import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

const STATUS_LABELS: Record<PresenceStatusEnum, string> = {
    [ PresenceStatusEnum.IN ]: 'Présent',
    [ PresenceStatusEnum.OUT ]: 'En sortie',
    [ PresenceStatusEnum.OVERDUE ]: 'En retard',
    [ PresenceStatusEnum.UNAVAILABLE ]: 'Indisponible',
}

function participant (id: string, firstName: string, lastName: string, status: PresenceStatusEnum): ParticipantResponseDto {
    return {
        id, firstName, lastName, status: { label: STATUS_LABELS[ status ], value: status },
        visible: true, creation: undefined, lastEdition: undefined, birthday: '2000-01-01', major: true,
        type: { label: 'Inscrit', value: ParticipantTypeEnum.REGISTERED }, groups: undefined,
        startAvailability: undefined, endAvailability: undefined, effectiveArrival: new Date(), effectiveDeparture: undefined, user: undefined,
    }
}

function group (id: string, name: string, members: ParticipantResponseDto[]): GroupResponseDto {
    const outside: number = members.filter((member: ParticipantResponseDto): boolean => member.status.value !== PresenceStatusEnum.IN).length
    return {
        id, name, members, visible: true, creation: undefined, lastEdition: undefined, status: undefined,
        startAvailability: undefined, endAvailability: undefined,
        membersCount: members.length, insideMembersCount: members.length - outside, outsideMembersCount: outside,
    }
}

const INTENDANCE: GroupResponseDto = group('g1', 'Équipe intendance', [
    participant('p1', 'Hugo', 'Lemoine', PresenceStatusEnum.OUT),
    participant('p2', 'Inès', 'Garnier', PresenceStatusEnum.IN),
])
const SANTE: GroupResponseDto = group('g2', 'Équipe santé', [
    participant('p3', 'Camille', 'Renaud', PresenceStatusEnum.OVERDUE),
    participant('p4', 'Sylvie', 'Bloch', PresenceStatusEnum.IN),
])
const TERRITORIAL: GroupResponseDto = group('g3', 'Équipe territoriale', [
    participant('p5', 'Léa', 'Fontaine', PresenceStatusEnum.IN),
    participant('p6', 'Théo', 'Marchand', PresenceStatusEnum.OUT),
])

export const ALL_GROUPS_MOCK: GroupResponseDto[] = [ INTENDANCE, SANTE, TERRITORIAL ]

export const MY_GROUPS_MOCK: GroupResponseDto[] = [ INTENDANCE, SANTE ]

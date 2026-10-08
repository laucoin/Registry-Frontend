import { describe, expect, it } from 'vitest'
import { ActivityMapper } from '@shared/mappers/activity.mapper'
import { AlertMapper } from '@shared/mappers/alert.mapper'
import { CommunicationMapper } from '@shared/mappers/communication.mapper'
import { CurrentUserMapper } from '@shared/mappers/current-user.mapper'
import { GroupMapper } from '@shared/mappers/group.mapper'
import { MovementMapper } from '@shared/mappers/movement.mapper'
import { PageMapper } from '@shared/mappers/page.mapper'
import { PairMapper } from '@shared/mappers/pair.mapper'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'
import { ProjectMapper } from '@shared/mappers/project.mapper'
import { ProjectProfileMapper } from '@shared/mappers/project-profile.mapper'
import { UserMapper } from '@shared/mappers/user.mapper'
import { VehicleMapper } from '@shared/mappers/vehicle.mapper'
import { ActivityResponseDto } from '@shared/models/dto/response/activity.response.dto'
import { AlertResponseDto } from '@shared/models/dto/response/alert.response.dto'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { CurrentUserResponseDto } from '@shared/models/dto/response/current-user.response.dto'
import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'
import { PageResponseDto } from '@shared/models/dto/response/page.response.dto'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { ProjectResponseDto } from '@shared/models/dto/response/project.response.dto'
import { ProjectProfileResponseDto } from '@shared/models/dto/response/project-profile.response.dto'
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto'
import { VehicleResponseDto } from '@shared/models/dto/response/vehicle.response.dto'

const WHEN: Date = new Date( '2026-01-05T10:00:00Z' )
const HISTORY: { dateTime: Date, user: { id: string, firstName: string, lastName: string, email: string } } = {
    dateTime: WHEN,
    user: { id: 'u0', firstName: 'Ada', lastName: 'L', email: 'ada@x.test' },
}

const USER: UserResponseDto = {
    id: 'u1', visible: true, creation: HISTORY, lastEdition: { dateTime: WHEN, user: undefined },
    firstName: 'Grace', lastName: 'H', email: 'g@x.test', role: { label: 'Admin', value: 'ADMIN' }, birthday: WHEN, lastLogin: WHEN, purged: false,
}
const PROJECT: ProjectResponseDto = {
    id: 'p1', visible: true, creation: HISTORY, lastEdition: HISTORY, name: 'Camp',
    status: undefined, begin: { date: '2026-01-01', time: undefined }, end: undefined, options: [],
}
const PARTICIPANT: ParticipantResponseDto = {
    id: 'pa1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT,
    firstName: 'A', lastName: 'B', birthday: '2010-01-01', major: false, type: { label: 'Registered', value: 'REGISTERED' as never },
    groups: undefined, status: { label: 'In', value: 'IN' as never }, startAvailability: undefined, endAvailability: undefined, user: USER, purged: false,
}

describe( 'mappers', () => {
    it( 'copies the generic fields and the history of a user', () => {
        // Arrange
        const dto: UserResponseDto = USER

        // Act
        const model: ReturnType<typeof UserMapper.toModel> = UserMapper.toModel( dto )

        // Assert
        expect( model ).toEqual( dto )
        expect( model ).not.toBe( dto )
        expect( model.creation.user?.email ).toBe( 'ada@x.test' )
        expect( model.lastEdition.user ).toBeUndefined()
    } )

    it( 'maps the preferences of a current user with its authorities', () => {
        // Arrange
        const dto: CurrentUserResponseDto = { ...USER, authorities: [ 'A', 'B' ], preferences: { userId: 'u1', theme: 'DARK', language: 'fr' } }

        // Act
        const model: ReturnType<typeof CurrentUserMapper.toModel> = CurrentUserMapper.toModel( dto )

        // Assert
        expect( model.authorities ).toEqual( [ 'A', 'B' ] )
        expect( model.preferences ).toEqual( { userId: 'u1', theme: 'DARK', language: 'fr' } )
        expect( model.email ).toBe( 'g@x.test' )
    } )

    it( 'maps a project profile with its user and project', () => {
        // Arrange
        const dto: ProjectProfileResponseDto = {
            id: 'pp1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT, user: USER,
            role: { label: 'Chief', value: 'CHIEF' }, availabilityStatus: { label: 'x', value: 'AVAILABLE' as never }, status: { label: 'y', value: 'ACCEPTED' as never },
            startAccess: undefined, endAccess: { date: '2026-02-01', time: '10:00:00' },
        }

        // Act
        const model: ReturnType<typeof ProjectProfileMapper.toModel> = ProjectProfileMapper.toModel( dto )

        // Assert
        expect( model.user.email ).toBe( 'g@x.test' )
        expect( model.project.name ).toBe( 'Camp' )
        expect( model.endAccess ).toEqual( { date: '2026-02-01', time: '10:00:00' } )
    } )

    it( 'maps a participant with its groups and its user, and leaves missing parts undefined', () => {
        // Arrange
        const group: GroupResponseDto = {
            id: 'g1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT,
            name: 'Wolves', status: undefined, startAvailability: undefined, endAvailability: undefined,
            membersCount: 1, insideMembersCount: 1, outsideMembersCount: 0, members: undefined,
        }
        const dto: ParticipantResponseDto = { ...PARTICIPANT, groups: [ group ] }

        // Act
        const withGroups: ReturnType<typeof ParticipantMapper.toModel> = ParticipantMapper.toModel( dto )
        const withoutGroups: ReturnType<typeof ParticipantMapper.toModel> = ParticipantMapper.toModel( { ...PARTICIPANT, user: undefined } )

        // Assert
        expect( withGroups.groups?.[ 0 ].name ).toBe( 'Wolves' )
        expect( withGroups.user?.firstName ).toBe( 'Grace' )
        expect( withoutGroups.groups ).toBeUndefined()
        expect( withoutGroups.user ).toBeUndefined()
    } )

    it( 'maps a group with its members', () => {
        // Arrange
        const dto: GroupResponseDto = {
            id: 'g1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT,
            name: 'Wolves', status: undefined, startAvailability: undefined, endAvailability: undefined,
            membersCount: 1, insideMembersCount: 1, outsideMembersCount: 0, members: [ PARTICIPANT ],
        }

        // Act
        const model: ReturnType<typeof GroupMapper.toModel> = GroupMapper.toModel( dto )

        // Assert
        expect( model.members ).toHaveLength( 1 )
        expect( model.members?.[ 0 ].firstName ).toBe( 'A' )
    } )

    it( 'maps a vehicle and an activity field by field', () => {
        // Arrange
        const vehicle: VehicleResponseDto = {
            id: 'v1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT,
            licensePlate: 'AB-123', brand: 'Ford', model: 'T', status: { label: 'In', value: 'IN' as never }, startAvailability: undefined, endAvailability: undefined,
        }
        const activity: ActivityResponseDto = {
            id: 'a1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT,
            name: 'Hike', status: undefined, description: 'd', duration: { label: '2h', value: 'PT2H' }, allowedParticipants: { lower: 1, upper: 5 },
            startAvailability: undefined, endAvailability: undefined,
        }

        // Act
        const vehicleModel: ReturnType<typeof VehicleMapper.toModel> = VehicleMapper.toModel( vehicle )
        const activityModel: ReturnType<typeof ActivityMapper.toModel> = ActivityMapper.toModel( activity )

        // Assert
        expect( vehicleModel.licensePlate ).toBe( 'AB-123' )
        expect( activityModel.allowedParticipants ).toEqual( { lower: 1, upper: 5 } )
    } )

    it( 'maps a movement with its content, reason and linked activity', () => {
        // Arrange
        const activity: ActivityResponseDto = {
            id: 'a1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT,
            name: 'Hike', status: undefined, description: undefined, duration: undefined, allowedParticipants: undefined, startAvailability: undefined, endAvailability: undefined,
        }
        const dto: MovementResponseDto = {
            id: 'm1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT,
            dateTime: WHEN, type: { label: 'In', value: 'IN' as never }, reason: { label: 'Arrival', value: 'r1', kind: 'REASON' },
            activity: { label: 'Hike', value: activity }, contentType: 'REGISTERED' as never,
            content: [ { poolName: 'car 1', participant: PARTICIPANT, vehicle: undefined } ],
        }

        // Act
        const model: ReturnType<typeof MovementMapper.toModel> = MovementMapper.toModel( dto )

        // Assert
        expect( model.content[ 0 ].participant.firstName ).toBe( 'A' )
        expect( model.content[ 0 ].vehicle ).toBeUndefined()
        expect( model.reason?.kind ).toBe( 'REASON' )
        expect( model.activity?.value.name ).toBe( 'Hike' )
        expect( model.activity?.label ).toBe( 'Hike' )
    } )

    it( 'maps an alert with its communications, each pointing back to a movement', () => {
        // Arrange
        const movement: MovementResponseDto = {
            id: 'm1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT,
            dateTime: WHEN, type: { label: 'In', value: 'IN' as never }, reason: undefined, activity: undefined, contentType: 'GUEST' as never, content: [],
        }
        const communication: CommunicationResponseDto = {
            id: 'c1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT, dateTime: WHEN, message: 'hello', movement, alert: undefined,
        }
        const dto: AlertResponseDto = {
            id: 'al1', visible: true, creation: HISTORY, lastEdition: HISTORY, project: PROJECT,
            dateTime: WHEN, title: 'Fire', status: { label: 'In progress', value: 'IN_PROGRESS' as never }, communications: [ communication ],
        }

        // Act
        const model: ReturnType<typeof AlertMapper.toModel> = AlertMapper.toModel( dto )
        const communicationModel: ReturnType<typeof CommunicationMapper.toModel> = CommunicationMapper.toModel( communication )

        // Assert
        expect( model.communications?.[ 0 ].message ).toBe( 'hello' )
        expect( model.communications?.[ 0 ].movement?.contentType ).toBe( 'GUEST' )
        expect( communicationModel.alert ).toBeUndefined()
    } )

    it( 'maps the elements of a page and keeps the paging fields', () => {
        // Arrange
        const dto: PageResponseDto<ProjectResponseDto> = { pageNumber: 2, pageSize: 10, totalElements: 21, totalPages: 3, content: [ PROJECT ], lastRefresh: WHEN }

        // Act
        const page: ReturnType<typeof PageMapper.toModel<ProjectResponseDto, ReturnType<typeof ProjectMapper.toModel>>> = PageMapper.toModel( dto, ProjectMapper.toModel )

        // Assert
        expect( page.content[ 0 ].name ).toBe( 'Camp' )
        expect( [ page.pageNumber, page.pageSize, page.totalElements, page.totalPages ] ).toEqual( [ 2, 10, 21, 3 ] )
        expect( page.lastRefresh ).toBe( WHEN )
    } )

    it( 'maps the value of a pair and keeps its key', () => {
        // Arrange
        const dto: { first: string, second: UserResponseDto[] } = { first: 'm1', second: [ USER ] }

        // Act
        const pair: ReturnType<typeof PairMapper.toModel<UserResponseDto[], ReturnType<typeof UserMapper.toModel>[]>> = PairMapper.toModel( dto, (users: UserResponseDto[]) => users.map( UserMapper.toModel ) )

        // Assert
        expect( pair.first ).toBe( 'm1' )
        expect( pair.second[ 0 ].email ).toBe( 'g@x.test' )
    } )
} )

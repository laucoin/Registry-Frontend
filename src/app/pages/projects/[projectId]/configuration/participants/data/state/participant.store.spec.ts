import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { ParticipantStore } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.store'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { UserModel } from '@shared/models/model/user.model'

describe( 'ParticipantStore', () => {
    let store: InstanceType<typeof ParticipantStore>
    let findParticipants: Mock<ParticipantApi['findParticipants']>
    let findParticipantMovements: Mock<ParticipantApi['findParticipantMovements']>
    let searchUsers: Mock<ParticipantApi['searchUsers']>
    let searchGroups: Mock<ParticipantApi['searchGroups']>
    let findMovementsContents: Mock<MovementApi['findMovementsContents']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        findParticipants = vi.fn()
        findParticipantMovements = vi.fn()
        searchUsers = vi.fn()
        searchGroups = vi.fn()
        findMovementsContents = vi.fn( () => of( [] ) )
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                ParticipantStore,
                { provide: ParticipantApi, useValue: { findParticipants, findParticipantMovements, searchUsers, searchGroups } },
                { provide: MovementApi, useValue: { findMovementsContents } },
                { provide: MetadataApi, useValue: { getPresencesStatus: vi.fn( () => of( [] ) ) } },
                { provide: ErrorReporter, useValue: { notify } },
                { provide: TranslocoService, useValue: { langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        store = TestBed.inject( ParticipantStore )
    } )

    it( 'appends the next batch to the participants already shown', () => {
        // Arrange
        findParticipants
            .mockReturnValueOnce( of( { ...pageOf<ParticipantModel>( [ { id: 'a1' } as ParticipantModel ] ), size: 1, totalPages: 2 } ) )
            .mockReturnValueOnce( of( { ...pageOf<ParticipantModel>( [ { id: 'a2' } as ParticipantModel ], 1 ), size: 1, totalPages: 2 } ) )
        store.fetchParticipantsPage( { projectId: 'p1', page: 0, size: 1 } )

        // Act
        store.fetchParticipantsPage( { projectId: 'p1', page: 1, size: 1 } )

        // Assert
        expect( store.participants.element()?.content.map( (element: ParticipantModel): string => element.id ) ).toEqual( [ 'a1', 'a2' ] )
    } )

    it( 'stores the fetched participants page', () => {
        // Arrange
        findParticipants.mockReturnValue( of( pageOf<ParticipantModel>( [ { id: 'pa1' } as ParticipantModel ] ) ) )

        // Act
        store.fetchParticipantsPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.participants.element()?.content ).toHaveLength( 1 )
        expect( store.participants.loading() ).toBe( false )
    } )

    it( 'keeps a failed participants fetch in the participants block', () => {
        // Arrange
        findParticipants.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchParticipantsPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.participants.error()?.summary ).toBe( 'Title' )
    } )

    it( 'keeps a 503 failure in its block', () => {
        // Arrange
        findParticipants.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchParticipantsPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.participants.error() ).toBeDefined()
    } )

    it( 'turns the searched users into select items', () => {
        // Arrange
        searchUsers.mockReturnValue( of( [ { id: 'u1', email: 'a@b.c', firstName: 'Ada', lastName: 'L' } as UserModel ] ) )

        // Act
        store.searchUsers( { projectId: 'p1', q: 'ada' } )

        // Assert
        expect( store.metadata.searchedUsers() ).toEqual( [ { label: 'a@b.c (Ada L)', value: expect.objectContaining( { id: 'u1' } ) } ] )
    } )

    it( 'turns the searched groups into select items', () => {
        // Arrange
        searchGroups.mockReturnValue( of( [ { id: 'g1', name: 'Wolves' } as GroupModel ] ) )

        // Act
        store.searchGroups( { projectId: 'p1', q: 'wo' } )

        // Assert
        expect( store.metadata.searchedGroups()[ 0 ].label ).toBe( 'Wolves' )
    } )

    it( 'notifies a failed user search and keeps the previous results', () => {
        // Arrange
        searchUsers.mockReturnValueOnce( of( [ { id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B' } as UserModel ] ) )
        searchUsers.mockReturnValueOnce( failing( ERROR_500 ) )
        store.searchUsers( { projectId: 'p1', q: 'a' } )

        // Act
        store.searchUsers( { projectId: 'p1', q: 'ab' } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( store.metadata.searchedUsers() ).toHaveLength( 1 )
    } )

    it( 'loads the movements of a participant and fetches their contents', () => {
        // Arrange
        findParticipantMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )

        // Act
        store.fetchParticipantMovementsPage( { projectId: 'p1', id: 'pa1', page: 0, size: 10 } )

        // Assert
        expect( findMovementsContents ).toHaveBeenCalledWith( 'p1', [ 'm1' ], false )
        expect( store.movements.element()?.content[ 0 ].content ).toEqual( [] )
    } )

    it( 'keeps a failed movements fetch in the movements block only', () => {
        // Arrange
        findParticipantMovements.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchParticipantMovementsPage( { projectId: 'p1', id: 'pa1', page: 0, size: 10 } )

        // Assert
        expect( store.movements.error()?.summary ).toBe( 'Title' )
        expect( store.participants.error() ).toBeUndefined()
    } )
} )

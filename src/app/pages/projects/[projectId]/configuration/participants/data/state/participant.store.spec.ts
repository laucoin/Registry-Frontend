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
import { ErrorModel } from '@shared/models/model/error.model'
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
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        findParticipants = vi.fn()
        findParticipantMovements = vi.fn()
        searchUsers = vi.fn()
        searchGroups = vi.fn()
        findMovementsContents = vi.fn( () => of( [] ) )
        setGlobalError = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                ParticipantStore,
                { provide: ParticipantApi, useValue: { findParticipants, findParticipantMovements, searchUsers, searchGroups } },
                { provide: MovementApi, useValue: { findMovementsContents } },
                { provide: MetadataApi, useValue: { getPresencesStatus: vi.fn( () => of( [] ) ) } },
                { provide: ErrorReporter, useValue: { setGlobalError, notify } },
                { provide: TranslocoService, useValue: { langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        store = TestBed.inject( ParticipantStore )
    } )

    it( 'stores the fetched participants page', () => {
        // Arrange
        findParticipants.mockReturnValue( of( pageOf<ParticipantModel>( [ { id: 'pa1' } as ParticipantModel ] ) ) )

        // Act
        store.fetchParticipantsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.participants.element()?.content ).toHaveLength( 1 )
        expect( store.participants.loading() ).toBe( false )
    } )

    it( 'keeps a failed participants fetch in the participants block', () => {
        // Arrange
        findParticipants.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchParticipantsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.participants.error()?.summary ).toBe( 'Title' )
    } )

    it( 'reports a 503 on the participants fetch as the global error', () => {
        // Arrange
        findParticipants.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchParticipantsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
    } )

    it( 'turns the searched users into select items', () => {
        // Arrange
        searchUsers.mockReturnValue( of( [ { id: 'u1', email: 'a@b.c', firstName: 'Ada', lastName: 'L' } as UserModel ] ) )

        // Act
        store.searchUsers( { projectId: 'p1', textSearched: 'ada' } )

        // Assert
        expect( store.metadata.searchedUsers() ).toEqual( [ { label: 'a@b.c (Ada L)', value: expect.objectContaining( { id: 'u1' } ) } ] )
    } )

    it( 'turns the searched groups into select items', () => {
        // Arrange
        searchGroups.mockReturnValue( of( [ { id: 'g1', name: 'Wolves' } as GroupModel ] ) )

        // Act
        store.searchGroups( { projectId: 'p1', textSearched: 'wo' } )

        // Assert
        expect( store.metadata.searchedGroups()[ 0 ].label ).toBe( 'Wolves' )
    } )

    it( 'notifies a failed user search and keeps the previous results', () => {
        // Arrange
        searchUsers.mockReturnValueOnce( of( [ { id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B' } as UserModel ] ) )
        searchUsers.mockReturnValueOnce( failing( ERROR_500 ) )
        store.searchUsers( { projectId: 'p1', textSearched: 'a' } )

        // Act
        store.searchUsers( { projectId: 'p1', textSearched: 'ab' } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( store.metadata.searchedUsers() ).toHaveLength( 1 )
    } )

    it( 'loads the movements of a participant and fetches their contents', () => {
        // Arrange
        findParticipantMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )

        // Act
        store.fetchParticipantMovementsPage( { projectId: 'p1', id: 'pa1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( findMovementsContents ).toHaveBeenCalledWith( 'p1', [ 'm1' ], false )
        expect( store.movements.element()?.content[ 0 ].content ).toEqual( [] )
    } )

    it( 'keeps a failed movements fetch in the movements block only', () => {
        // Arrange
        findParticipantMovements.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchParticipantMovementsPage( { projectId: 'p1', id: 'pa1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.movements.error()?.summary ).toBe( 'Title' )
        expect( store.participants.error() ).toBeUndefined()
    } )
} )

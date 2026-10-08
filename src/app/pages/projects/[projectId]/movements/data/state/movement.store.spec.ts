import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { UiFacade } from '@core/registry/state/ui.facade'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { ErrorModel } from '@shared/models/model/error.model'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

describe( 'MovementStore', () => {
    let store: InstanceType<typeof MovementStore>
    let findMovements: Mock<MovementApi['findMovements']>
    let findMovementsContents: Mock<MovementApi['findMovementsContents']>
    let findMovementCommunications: Mock<MovementApi['findMovementCommunications']>
    let searchParticipantsAndGroups: Mock<MovementApi['searchParticipantsAndGroups']>
    let searchVehicles: Mock<MovementApi['searchVehicles']>
    let getMovementsTypes: Mock<MetadataApi['getMovementsTypes']>
    let getParticipantsTypes: Mock<MetadataApi['getParticipantsTypes']>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>
    let langChanges: Subject<string>

    beforeEach( () => {
        findMovements = vi.fn()
        findMovementsContents = vi.fn( () => of( [] ) )
        findMovementCommunications = vi.fn()
        searchParticipantsAndGroups = vi.fn()
        searchVehicles = vi.fn()
        getMovementsTypes = vi.fn( () => of( [ { label: 'In', value: 'IN' } ] ) ) as unknown as Mock<MetadataApi['getMovementsTypes']>
        getParticipantsTypes = vi.fn( () => of( [ { label: 'Registered', value: ParticipantTypeEnum.REGISTERED } ] ) )
        setGlobalError = vi.fn()
        notify = vi.fn()
        langChanges = new Subject<string>()
        TestBed.configureTestingModule( {
            providers: [
                MovementStore,
                { provide: MovementApi, useValue: { findMovements, findMovementsContents, findMovementCommunications, searchParticipantsAndGroups, searchVehicles } },
                { provide: MetadataApi, useValue: { getMovementsTypes, getParticipantsTypes } },
                { provide: UiFacade, useValue: { setGlobalError, notify } },
                { provide: TranslocoService, useValue: { langChanges$: langChanges.asObservable(), translate: (key: string): string => key } },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string, count: unknown[]): string => `${key}:${count?.length}` } },
            ],
        } )
        store = TestBed.inject( MovementStore )
    } )

    it( 'loads the movement types with an empty option first and the participant types as they are', () => {
        // Arrange
        const expectedFirst: unknown = { label: '-', value: undefined }

        // Act
        const types: unknown[] = store.metadata.types()

        // Assert
        expect( types[ 0 ] ).toEqual( expectedFirst )
        expect( types ).toHaveLength( 2 )
        expect( store.metadata.participantTypes() ).toHaveLength( 1 )
    } )

    it( 'reloads both type lists when the language changes but not on the initial language', () => {
        // Arrange
        langChanges.next( 'fr' )
        const callsAfterInitial: number = getMovementsTypes.mock.calls.length

        // Act
        langChanges.next( 'en' )

        // Assert
        expect( callsAfterInitial ).toBe( 1 )
        expect( getMovementsTypes ).toHaveBeenCalledTimes( 2 )
        expect( getParticipantsTypes ).toHaveBeenCalledTimes( 2 )
    } )

    it( 'stores the fetched movements page and fetches the contents of its movements', () => {
        // Arrange
        findMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel, { id: 'm2' } as MovementModel ] ) ) )
        findMovementsContents.mockReturnValue( of( [ { first: 'm2', second: [ { id: 'c' } as unknown as MovementContentModel ] } ] ) )

        // Act
        store.fetchMovementsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( findMovementsContents ).toHaveBeenCalledWith( 'p1', [ 'm1', 'm2' ], false )
        expect( store.movements.element()?.content[ 0 ].content ).toEqual( [] )
        expect( store.movements.element()?.content[ 1 ].content ).toHaveLength( 1 )
    } )

    it( 'does not fetch contents for an empty movements page', () => {
        // Arrange
        findMovements.mockReturnValue( of( pageOf<MovementModel>( [] ) ) )

        // Act
        store.fetchMovementsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( findMovementsContents ).not.toHaveBeenCalled()
    } )

    it( 'keeps a failed movements fetch in the movements block', () => {
        // Arrange
        findMovements.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchMovementsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.movements.error()?.summary ).toBe( 'Title' )
        expect( store.movementCommunications.error() ).toBeUndefined()
    } )

    it( 'reports a 503 on the movements fetch as the global error', () => {
        // Arrange
        findMovements.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchMovementsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
    } )

    it( 'only lists visible communications by default', () => {
        // Arrange
        const expected: boolean = true

        // Act
        const visibility: boolean | undefined = store.movementCommunications.params.visibilitySearched()

        // Assert
        expect( visibility ).toBe( expected )
    } )

    it( 'stores the communications of a movement', () => {
        // Arrange
        findMovementCommunications.mockReturnValue( of( pageOf<CommunicationModel>( [ { id: 'c1' } as CommunicationModel ] ) ) )

        // Act
        store.fetchMovementCommunicationsPage( { projectId: 'p1', id: 'm1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.movementCommunications.element()?.content ).toHaveLength( 1 )
        expect( store.movements.element() ).toBeUndefined()
    } )

    it( 'groups the searched participants and groups under labels pluralized by their own count', () => {
        // Arrange
        searchParticipantsAndGroups.mockReturnValue( of( {
            participants: [ { id: 'pa1', firstName: 'Ada', lastName: 'L' } as ParticipantModel ],
            groups: [ { id: 'g1', name: 'A' } as GroupModel, { id: 'g2', name: 'B' } as GroupModel, { id: 'g3', name: 'C' } as GroupModel ],
        } ) )

        // Act
        store.searchParticipantsAndGroups( { projectId: 'p1', contentTypeSearched: ParticipantTypeEnum.REGISTERED, textSearched: 'a' } )

        // Assert
        const labels: (string | undefined)[] = store.metadata.searchedParticipantsAndGroups().map( (group: { label?: string }): string | undefined => group.label )
        expect( labels ).toEqual( [
            'movements.form.content.registered.searched.group:3',
            'movements.form.content.registered.searched.participant:1',
        ] )
    } )

    it( 'omits the group sections that are empty', () => {
        // Arrange
        searchParticipantsAndGroups.mockReturnValue( of( { participants: [], groups: [] } ) )

        // Act
        store.searchParticipantsAndGroups( { projectId: 'p1', contentTypeSearched: ParticipantTypeEnum.REGISTERED, textSearched: 'a' } )

        // Assert
        expect( store.metadata.searchedParticipantsAndGroups() ).toEqual( [] )
    } )

    it( 'turns the searched vehicles into select items', () => {
        // Arrange
        searchVehicles.mockReturnValue( of( [ { id: 'v1', licensePlate: 'AB-123', brand: 'Ford', model: 'T' } as VehicleModel ] ) )

        // Act
        store.searchVehicles( { projectId: 'p1', textSearched: 'ab' } )

        // Assert
        expect( store.metadata.searchedVehicles() ).toHaveLength( 1 )
    } )

    it( 'notifies a failed vehicle search and keeps the previous results', () => {
        // Arrange
        searchVehicles.mockReturnValueOnce( of( [ { id: 'v1', licensePlate: 'AB-123' } as VehicleModel ] ) )
        searchVehicles.mockReturnValueOnce( failing( ERROR_500 ) )
        store.searchVehicles( { projectId: 'p1', textSearched: 'a' } )

        // Act
        store.searchVehicles( { projectId: 'p1', textSearched: 'ab' } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( store.metadata.searchedVehicles() ).toHaveLength( 1 )
    } )
} )

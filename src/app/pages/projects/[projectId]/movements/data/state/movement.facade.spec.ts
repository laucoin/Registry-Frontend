import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { Observable, of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ERROR_500, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementModel } from '@shared/models/model/movement.model'

const MOVEMENT: MovementModel = {
    id: 'm1',
    dateTime: new Date(),
    type: { label: 'In', value: MovementTypeEnum.IN },
    content: [ {}, {} ],
} as unknown as MovementModel

describe( 'MovementFacade', () => {
    let facade: MovementFacade
    let findMovements: Mock<MovementApi['findMovements']>
    let createMovement: Mock<MovementApi['createMovement']>
    let createGuestsMovement: Mock<MovementApi['createGuestsMovement']>
    let updateMovementById: Mock<MovementApi['updateMovementById']>
    let updateGuestsMovementById: Mock<MovementApi['updateGuestsMovementById']>
    let disableMovementById: Mock<MovementApi['disableMovementById']>
    let getMovementsTypes: Mock<MetadataApi['getMovementsTypes']>
    let notify: Mock<(message: unknown) => void>
    let api: Record<string, Mock>

    beforeEach( () => {
        provideTestConfig()
        findMovements = vi.fn( () => of( pageOf<MovementModel>( [], 2 ) ) )
        createMovement = vi.fn( () => of( MOVEMENT ) )
        createGuestsMovement = vi.fn( () => of( MOVEMENT ) )
        updateMovementById = vi.fn( () => of( MOVEMENT ) )
        updateGuestsMovementById = vi.fn( () => of( MOVEMENT ) )
        disableMovementById = vi.fn()
        getMovementsTypes = vi.fn( () => of( [] ) ) as unknown as Mock<MetadataApi['getMovementsTypes']>
        notify = vi.fn()
        api = {
            findMovementById: vi.fn(), enableMovementById: vi.fn(), deleteMovementById: vi.fn(), findMovementCommunications: vi.fn( () => of( pageOf<never>( [], 0 ) ) ),
            searchReasonsAndActivities: vi.fn( () => of( [] ) ), searchParticipantsAndGroups: vi.fn( () => of( { participants: [], groups: [] } ) ), searchVehicles: vi.fn( () => of( [] ) ),
        }
        TestBed.configureTestingModule( {
            providers: [
                MovementFacade,
                MovementStore,
                { provide: MovementApi, useValue: { findMovements, createMovement, createGuestsMovement, updateMovementById, updateGuestsMovementById, disableMovementById, ...api, findMovementsContents: vi.fn( () => of( [] ) ) } },
                { provide: MetadataApi, useValue: { getMovementsTypes, getParticipantsTypes: vi.fn( () => of( [] ) ) } },
                { provide: DateFormatPipe, useValue: { transform: (): string => '01/01' } },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string, count: unknown[]): string => `${key}:${count?.length}` } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}`, langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        facade = TestBed.inject( MovementFacade )
        facade.fetchMovementsPage( 2, 10 )
        findMovements.mockClear()
        getMovementsTypes.mockClear()
    } )

    it( 'fetches the requested page for the selected project', () => {
        // Arrange
        const page: number = 3

        // Act
        facade.fetchMovementsPage( page, 10 )

        // Assert
        expect( findMovements ).toHaveBeenCalledWith( 'p1', 3, 10, expect.anything() )
    } )

    it( 'restarts from the first page when the search changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'IN', undefined, undefined, undefined )

        // Act
        facade.fetchMovementsPage( 4, 10 )

        // Assert
        expect( findMovements ).toHaveBeenCalledWith( 'p1', 0, 10, expect.anything() )
    } )

    it( 'does not reload the movement types once they are known', () => {
        // Arrange
        const typesLoadedOnInit: number = 1

        // Act
        facade.fetchMovementTypes()

        // Assert
        expect( facade.movementTypesMetadata() ).toHaveLength( 1 )
        expect( getMovementsTypes ).not.toHaveBeenCalled()
        expect( typesLoadedOnInit ).toBe( 1 )
    } )

    it( 'registers a movement of registered participants through the registered endpoint', () => {
        // Arrange
        const movement: never = {} as never

        // Act
        facade.createRegisteredMovement( movement ).subscribe()

        // Assert
        expect( createMovement ).toHaveBeenCalledTimes( 1 )
        expect( createGuestsMovement ).not.toHaveBeenCalled()
    } )

    it( 'registers a movement of guests through the guests endpoint', () => {
        // Arrange
        const movement: never = {} as never

        // Act
        facade.createGuestMovement( movement ).subscribe()

        // Assert
        expect( createGuestsMovement ).toHaveBeenCalledTimes( 1 )
        expect( createMovement ).not.toHaveBeenCalled()
    } )

    it( 'updates registered movements through the registered endpoint', () => {
        // Arrange
        const movement: never = {} as never

        // Act
        facade.updateRegisteredMovement( 'm1', movement ).subscribe()

        // Assert
        expect( updateMovementById ).toHaveBeenCalledTimes( 1 )
        expect( updateGuestsMovementById ).not.toHaveBeenCalled()
    } )

    it( 'updates guests movements through the guests endpoint', () => {
        // Arrange
        const movement: never = {} as never

        // Act
        facade.updateGuestMovement( 'm1', movement ).subscribe()

        // Assert
        expect( updateGuestsMovementById ).toHaveBeenCalledTimes( 1 )
        expect( updateMovementById ).not.toHaveBeenCalled()
    } )

    it( 'pluralizes the creation message by the number of people and counts them', () => {
        // Arrange
        const movement: never = {} as never

        // Act
        facade.createRegisteredMovement( movement ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( {
            summary: 'movements.notifications.create.IN.title',
            detail: 'movements.notifications.create.IN.message:2',
            data: { datetime: '01/01', participants: 2 },
        } ) )
    } )

    it( 'uses the edit translation keys for an update', () => {
        // Arrange
        const movement: never = {} as never

        // Act
        facade.updateRegisteredMovement( 'm1', movement ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'movements.notifications.edit.IN.title' } ) )
    } )

    it( 'lets the form handle a creation error other than 503', () => {
        // Arrange
        createMovement.mockReturnValue( failing( ERROR_500 ) )
        let received: ErrorModel | undefined

        // Act
        facade.createRegisteredMovement( {} as never ).subscribe( { error: (error: ErrorModel): void => { received = error } } )

        // Assert
        expect( received ).toBe( ERROR_500 )
        expect( notify ).not.toHaveBeenCalled()
    } )

    it( 'reloads every shown batch of the movements in one request', () => {
        // Arrange
        findMovements.mockReturnValue( of( pageOf<MovementModel>( [], 1 ) ) )
        facade.fetchMovementsPage( 1, 10 )
        findMovements.mockClear()

        // Act
        facade.reloadMovementsPage()

        // Assert
        expect( findMovements ).toHaveBeenCalledWith( 'p1', 0, facade.movementsPage()!.size * 2, expect.anything() )
    } )

    it( 'fetches a movement of the selected project', () => {
        // Arrange
        api[ 'findMovementById' ].mockReturnValue( of( MOVEMENT ) )
        let received: MovementModel | undefined

        // Act
        facade.fetchMovement( 'm1' ).subscribe( (it: MovementModel): void => { received = it } )

        // Assert
        expect( api[ 'findMovementById' ] ).toHaveBeenCalledWith( 'p1', 'm1' )
        expect( received?.id ).toBe( 'm1' )
    } )

    it( 'notifies a failed movement fetch', () => {
        // Arrange
        api[ 'findMovementById' ].mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.fetchMovement( 'm1' ).subscribe( { error: (): void => undefined } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
    } )

    it.each( [ 'disable', 'enable' ] as const )( 'announces the movement %s on the current-page reload channel', (command: 'disable' | 'enable') => {
        // Arrange
        disableMovementById.mockReturnValue( of( MOVEMENT ) )
        api[ 'enableMovementById' ].mockReturnValue( of( MOVEMENT ) )
        const reloaded: Mock = vi.fn()
        facade.handleMovementCurrentPageReload().subscribe( reloaded )

        // Act
        const run$: Observable<MovementModel> = command === 'disable' ? facade.disableMovement( 'm1' ) : facade.enableMovement( 'm1' )
        run$.subscribe()

        // Assert
        expect( reloaded ).toHaveBeenCalledTimes( 1 )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: `movements.notifications.${ command }.IN.title` } ) )
    } )

    it( 'announces a deletion on the first-page reload channel and refreshes the page', () => {
        // Arrange
        api[ 'deleteMovementById' ].mockReturnValue( of( undefined ) )
        const reloaded: Mock = vi.fn()
        facade.handleMovementFirstPageReload().subscribe( reloaded )

        // Act
        facade.deleteMovement( MOVEMENT ).subscribe()

        // Assert
        expect( api[ 'deleteMovementById' ] ).toHaveBeenCalledWith( undefined, 'm1' )
        expect( reloaded ).toHaveBeenCalledTimes( 1 )
        expect( findMovements ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'does not refresh the page when a deletion fails', () => {
        // Arrange
        api[ 'deleteMovementById' ].mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.deleteMovement( MOVEMENT ).subscribe( { error: (): void => undefined } )

        // Assert
        expect( findMovements ).not.toHaveBeenCalled()
    } )

    it( 'loads the next page of older communications only while there is one', () => {
        // Arrange
        api[ 'findMovementCommunications' ].mockReturnValue( of( { ...pageOf<never>( [], 0 ), hasNext: true } ) )
        facade.fetchMovementCommunicationsPage( 'm1', 0, 10 )
        api[ 'findMovementCommunications' ].mockClear()

        // Act
        facade.loadOlderMovementCommunications( 'm1' )

        // Assert
        expect( api[ 'findMovementCommunications' ] ).toHaveBeenCalledWith( 'p1', 'm1', 1, 10, expect.anything() )
    } )

    it( 'loads no older communications when the shown page is the last one', () => {
        // Arrange
        facade.fetchMovementCommunicationsPage( 'm1', 0, 10 )
        api[ 'findMovementCommunications' ].mockClear()

        // Act
        facade.loadOlderMovementCommunications( 'm1' )

        // Assert
        expect( api[ 'findMovementCommunications' ] ).not.toHaveBeenCalled()
    } )

    it( 'reloads the shown communications of a movement in one request', () => {
        // Arrange
        facade.fetchMovementCommunicationsPage( 'm1', 0, 10 )
        api[ 'findMovementCommunications' ].mockClear()

        // Act
        facade.reloadMovementCommunications( 'm1' )

        // Assert
        expect( api[ 'findMovementCommunications' ] ).toHaveBeenCalledWith( 'p1', 'm1', 0, expect.any( Number ), expect.anything() )
    } )

    it( 'searches the reasons, participants and vehicles of the selected project', () => {
        // Arrange
        const query: string = 'ada'

        // Act
        facade.searchReasonsAndActivities( query, 'IN', ParticipantTypeEnum.REGISTERED )
        facade.searchParticipantsAndGroups( ParticipantTypeEnum.REGISTERED, query )
        facade.searchVehicles( query )

        // Assert
        expect( api[ 'searchReasonsAndActivities' ] ).toHaveBeenCalledWith( 'p1', 'ada', 'IN', ParticipantTypeEnum.REGISTERED )
        expect( api[ 'searchParticipantsAndGroups' ] ).toHaveBeenCalledWith( 'p1', ParticipantTypeEnum.REGISTERED, 'ada' )
        expect( api[ 'searchVehicles' ] ).toHaveBeenCalledWith( 'p1', 'ada' )
    } )

    it( 'exposes the date bounds, the type and the visibility of the search once input', () => {
        // Arrange
        const from: Date = new Date( '2026-01-01T00:00:00.000Z' )
        const to: Date = new Date( '2026-02-01T00:00:00.000Z' )

        // Act
        facade.inputPageSearchParameters( 'IN', from, to, true )

        // Assert
        expect( facade.movementsPageFromParam()?.toISOString() ).toBe( from.toISOString() )
        expect( facade.movementsPageToParam()?.toISOString() ).toBe( to.toISOString() )
        expect( facade.movementsPageTypeParam() ).toBe( 'IN' )
        expect( facade.movementsPageIsVisibleParam() ).toBe( true )
    } )

    it( 'keeps the search when the same values are input again', () => {
        // Arrange
        facade.inputPageSearchParameters( 'IN', undefined, undefined, undefined )

        // Act
        facade.inputPageSearchParameters( 'IN', undefined, undefined, undefined )

        // Assert
        expect( facade.movementsPageTypeParam() ).toBe( 'IN' )
    } )

    it( 'translates the visibility labels except the empty option', () => {
        // Arrange
        const expectedPrefix: string = 't:'

        // Act
        const labels: (string | undefined)[] = facade.visibilitiesMetadata().map( (item: { label?: string }): string | undefined => item.label )

        // Assert
        expect( labels.every( (it: string | undefined): boolean => it === '-' || it!.startsWith( expectedPrefix ) ) ).toBe( true )
    } )

    it( 'counts no participant in the notification of a movement without content', () => {
        // Arrange
        disableMovementById.mockReturnValue( of( { ...MOVEMENT, content: undefined } as unknown as MovementModel ) )

        // Act
        facade.disableMovement( 'm1' ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { data: expect.objectContaining( { participants: 0 } ) } ) )
    } )

    it( 'restarts the communications from the first page when their search was reset', () => {
        // Arrange
        facade.fetchMovementCommunicationsPage( 'm1', 3, 10 )

        // Act
        facade.fetchMovementCommunicationsPage( 'm1', 4, 10 )

        // Assert
        expect( api[ 'findMovementCommunications' ] ).toHaveBeenLastCalledWith( 'p1', 'm1', 4, 10, expect.anything() )
    } )
} )

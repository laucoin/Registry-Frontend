import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
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
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
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
        TestBed.configureTestingModule( {
            providers: [
                MovementFacade,
                MovementStore,
                { provide: MovementApi, useValue: { findMovements, createMovement, createGuestsMovement, updateMovementById, updateGuestsMovementById, disableMovementById, findMovementsContents: vi.fn( () => of( [] ) ) } },
                { provide: MetadataApi, useValue: { getMovementsTypes, getParticipantsTypes: vi.fn( () => of( [] ) ) } },
                { provide: DateFormatPipe, useValue: { transform: (): string => '01/01' } },
                { provide: PluralTranslationPipe, useValue: { transform: (key: string, count: unknown[]): string => `${key}:${count?.length}` } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify, setGlobalError: vi.fn() } },
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
        const pageNumber: number = 3

        // Act
        facade.fetchMovementsPage( pageNumber, 10 )

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
        const movement: never = { contentType: ParticipantTypeEnum.REGISTERED } as never

        // Act
        facade.createMovement( movement ).subscribe()

        // Assert
        expect( createMovement ).toHaveBeenCalledTimes( 1 )
        expect( createGuestsMovement ).not.toHaveBeenCalled()
    } )

    it( 'registers a movement of guests through the guests endpoint', () => {
        // Arrange
        const movement: never = { contentType: ParticipantTypeEnum.GUEST } as never

        // Act
        facade.createMovement( movement ).subscribe()

        // Assert
        expect( createGuestsMovement ).toHaveBeenCalledTimes( 1 )
        expect( createMovement ).not.toHaveBeenCalled()
    } )

    it( 'updates guests movements through the guests endpoint', () => {
        // Arrange
        const movement: never = { contentType: ParticipantTypeEnum.GUEST } as never

        // Act
        facade.updateMovement( 'm1', movement ).subscribe()

        // Assert
        expect( updateGuestsMovementById ).toHaveBeenCalledTimes( 1 )
        expect( updateMovementById ).not.toHaveBeenCalled()
    } )

    it( 'pluralizes the creation message by the number of people and counts them', () => {
        // Arrange
        const movement: never = { contentType: ParticipantTypeEnum.REGISTERED } as never

        // Act
        facade.createMovement( movement ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( {
            summary: 'movements.notifications.create.IN.title',
            detail: 'movements.notifications.create.IN.message:2',
            data: { datetime: '01/01', participants: 2 },
        } ) )
    } )

    it( 'uses the edit translation keys for an update', () => {
        // Arrange
        const movement: never = { contentType: ParticipantTypeEnum.REGISTERED } as never

        // Act
        facade.updateMovement( 'm1', movement ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'movements.notifications.edit.IN.title' } ) )
    } )

    it( 'announces every change on the changes channel and refreshes the page', () => {
        // Arrange
        const changes: string[] = []
        facade.handleMovementChanges().subscribe( (event: unknown): number => changes.push( (event as { command: string }).command ) )
        disableMovementById.mockReturnValue( of( MOVEMENT ) )

        // Act
        facade.disableMovement( 'm1' ).subscribe()

        // Assert
        expect( changes ).toEqual( [ 'disable' ] )
        expect( findMovements ).toHaveBeenCalledWith( 'p1', 2, 10, expect.anything() )
    } )

    it( 'lets the form handle a creation error other than 503', () => {
        // Arrange
        createMovement.mockReturnValue( failing( ERROR_500 ) )
        let received: ErrorModel | undefined

        // Act
        facade.createMovement( { contentType: ParticipantTypeEnum.REGISTERED } as never ).subscribe( { error: (error: ErrorModel): void => { received = error } } )

        // Assert
        expect( received ).toBe( ERROR_500 )
        expect( notify ).not.toHaveBeenCalled()
    } )
} )

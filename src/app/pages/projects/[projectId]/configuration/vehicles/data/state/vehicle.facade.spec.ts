import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { Observable, of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ERROR_500, ERROR_503, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { ErrorModel } from '@shared/models/model/error.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

describe( 'VehicleFacade', () => {
    let facade: VehicleFacade
    let findVehicles: Mock<VehicleApi['findVehicles']>
    let createVehicle: Mock<VehicleApi['createVehicle']>
    let enableVehicleById: Mock<VehicleApi['enableVehicleById']>
    let api: Record<string, Mock>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        provideTestConfig()
        findVehicles = vi.fn( () => of( pageOf<VehicleModel>( [], 2 ) ) )
        createVehicle = vi.fn()
        enableVehicleById = vi.fn()
        api = { findVehicleById: vi.fn(), updateVehicleById: vi.fn(), disableVehicleById: vi.fn(), deleteVehicleById: vi.fn() }
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                VehicleFacade,
                VehicleStore,
                { provide: VehicleApi, useValue: { findVehicles, createVehicle, enableVehicleById, ...api } },
                { provide: MovementApi, useValue: { findMovementsContents: vi.fn( () => of( [] ) ) } },
                { provide: MetadataApi, useValue: { getPresencesStatus: vi.fn( () => of( [] ) ) } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}`, langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        facade = TestBed.inject( VehicleFacade )
        facade.fetchVehiclesPage( 2, 10 )
        findVehicles.mockClear()
    } )

    it( 'fetches the requested page for the selected project', () => {
        // Arrange
        const page: number = 3

        // Act
        facade.fetchVehiclesPage( page, 10 )

        // Assert
        expect( findVehicles ).toHaveBeenCalledWith( 'p1', 3, 10, expect.anything() )
    } )

    it( 'restarts from the first page when the search changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'van', undefined, undefined, undefined )

        // Act
        facade.fetchVehiclesPage( 4, 10 )

        // Assert
        expect( findVehicles ).toHaveBeenCalledWith( 'p1', 0, 10, expect.anything() )
    } )

    it( 'translates the visibility labels except the empty option', () => {
        // Arrange
        const expected: (string | undefined)[] = [ '-', 't:vehicles.visible.true', 't:vehicles.visible.false' ]

        // Act
        const labels: (string | undefined)[] = facade.visibilitiesMetadata().map( (item: { label?: string }): string | undefined => item.label )

        // Assert
        expect( labels ).toEqual( expected )
    } )

    it( 'notifies with the vehicle identity and refreshes the page after a creation', () => {
        // Arrange
        createVehicle.mockReturnValue( of( { id: 'v1', licensePlate: 'AB-123' } as VehicleModel ) )

        // Act
        facade.createVehicle( {} as never ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'vehicles.notifications.create.title', data: expect.objectContaining( { registration: 'AB-123' } ) } ) )
        expect( findVehicles ).toHaveBeenCalledWith( 'p1', 0, 30, expect.anything() )
    } )

    it( 'lets the form handle a creation error other than 503', () => {
        // Arrange
        createVehicle.mockReturnValue( failing( ERROR_500 ) )
        let received: ErrorModel | undefined

        // Act
        facade.createVehicle( {} as never ).subscribe( { error: (error: ErrorModel): void => { received = error } } )

        // Assert
        expect( received ).toBe( ERROR_500 )
        expect( notify ).not.toHaveBeenCalled()
    } )

    it( 'rethrows a 503 on creation for the form to display', () => {
        // Arrange
        createVehicle.mockReturnValue( failing( ERROR_503 ) )
        let received: unknown

        // Act
        facade.createVehicle( {} as never ).subscribe( { error: (error: unknown): void => { received = error } } )

        // Assert
        expect( received ).toBe( ERROR_503 )
    } )

    it( 'notifies a failed enable instead of rethrowing it', () => {
        // Arrange
        enableVehicleById.mockReturnValue( failing( ERROR_500 ) )
        let completed: boolean = false

        // Act
        facade.enableVehicle( 'v1' ).subscribe( { complete: (): void => { completed = true } } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( completed ).toBe( true )
    } )

    it( 'reloads every shown batch of the movements of a vehicle in one request', () => {
        // Arrange
        const finder: Mock = vi.fn( () => of( pageOf<never>( [], 1 ) ) )
        ;(TestBed.inject( VehicleApi ) as unknown as Record<string, Mock>)[ 'findVehicleMovements' ] = finder
        facade.fetchVehicleMovementsPage( 'e1', 1, 10 )
        finder.mockClear()

        // Act
        facade.reloadVehicleMovementsPage( 'e1' )

        // Assert
        expect( finder ).toHaveBeenCalledWith( 'p1', 'e1', 0, expect.any( Number ), expect.anything() )
    } )

    it( 'fetches a vehicle of the selected project', () => {
        // Arrange
        api[ 'findVehicleById' ].mockReturnValue( of( { id: 'v1' } as VehicleModel ) )
        let received: VehicleModel | undefined

        // Act
        facade.fetchVehicle( 'v1' ).subscribe( (it: VehicleModel): void => { received = it } )

        // Assert
        expect( api[ 'findVehicleById' ] ).toHaveBeenCalledWith( 'p1', 'v1' )
        expect( received?.id ).toBe( 'v1' )
    } )

    it( 'notifies a failed vehicle fetch', () => {
        // Arrange
        api[ 'findVehicleById' ].mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.fetchVehicle( 'v1' ).subscribe( { error: (): void => undefined } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
    } )

    it( 'sends the version of the vehicle on update and announces the edition', () => {
        // Arrange
        api[ 'updateVehicleById' ].mockReturnValue( of( { id: 'v1', licensePlate: 'AB-123' } as VehicleModel ) )

        // Act
        facade.updateVehicle( 'v1', {} as never, 'etag-1' ).subscribe()

        // Assert
        expect( api[ 'updateVehicleById' ] ).toHaveBeenCalledWith( 'p1', 'v1', {}, 'etag-1' )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'vehicles.notifications.edit.title' } ) )
        expect( findVehicles ).toHaveBeenCalledTimes( 1 )
    } )

    it.each( [ 'disable', 'delete' ] as const )( 'notifies and refreshes the page after the vehicle is %sd', (command: 'disable' | 'delete') => {
        // Arrange
        const vehicle: VehicleModel = { id: 'v1', licensePlate: 'AB-123' } as VehicleModel
        api[ 'disableVehicleById' ].mockReturnValue( of( vehicle ) )
        api[ 'deleteVehicleById' ].mockReturnValue( of( undefined ) )

        // Act
        const run$: Observable<unknown> = command === 'disable' ? facade.disableVehicle( 'v1' ) : facade.deleteVehicle( vehicle )
        run$.subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: `vehicles.notifications.${ command }.title` } ) )
        expect( findVehicles ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'does not refresh the page when a deletion fails', () => {
        // Arrange
        api[ 'deleteVehicleById' ].mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.deleteVehicle( { id: 'v1' } as VehicleModel ).subscribe( { error: (): void => undefined } )

        // Assert
        expect( findVehicles ).not.toHaveBeenCalled()
    } )

    it( 'restarts the movements from the first page when their search changed', () => {
        // Arrange
        const finder: Mock = vi.fn( () => of( pageOf<never>( [], 1 ) ) )
        ;(TestBed.inject( VehicleApi ) as unknown as Record<string, Mock>)[ 'findVehicleMovements' ] = finder
        facade.inputMovementsPageSearchParameters( 'IN', new Date( '2026-01-01T00:00:00.000Z' ), undefined, true )

        // Act
        facade.fetchVehicleMovementsPage( 'v1', 4, 10 )

        // Assert
        expect( finder ).toHaveBeenCalledWith( 'p1', 'v1', 0, 10, expect.anything() )
        expect( facade.vehicleMovementsPageTypeParam() ).toBe( 'IN' )
        expect( facade.vehicleMovementsPageFromParam()?.toISOString() ).toBe( '2026-01-01T00:00:00.000Z' )
    } )

    it( 'keeps the movements search when the same values are input again', () => {
        // Arrange
        facade.inputMovementsPageSearchParameters( 'IN', undefined, undefined, undefined )

        // Act
        facade.inputMovementsPageSearchParameters( 'IN', undefined, undefined, undefined )

        // Assert
        expect( facade.vehicleMovementsPageTypeParam() ).toBe( 'IN' )
    } )
} )

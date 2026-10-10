import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
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
    let notify: Mock<(message: unknown) => void>
    let setGlobalError: Mock<(error: ErrorModel) => void>

    beforeEach( () => {
        provideTestConfig()
        findVehicles = vi.fn( () => of( pageOf<VehicleModel>( [], 2 ) ) )
        createVehicle = vi.fn()
        enableVehicleById = vi.fn()
        notify = vi.fn()
        setGlobalError = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                VehicleFacade,
                VehicleStore,
                { provide: VehicleApi, useValue: { findVehicles, createVehicle, enableVehicleById } },
                { provide: MovementApi, useValue: { findMovementsContents: vi.fn( () => of( [] ) ) } },
                { provide: MetadataApi, useValue: { getPresencesStatus: vi.fn( () => of( [] ) ) } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify, setGlobalError } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}`, langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        facade = TestBed.inject( VehicleFacade )
        facade.fetchVehiclesPage( 2, 10 )
        findVehicles.mockClear()
    } )

    it( 'fetches the requested page for the selected project', () => {
        // Arrange
        const pageNumber: number = 3

        // Act
        facade.fetchVehiclesPage( pageNumber, 10 )

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
        expect( findVehicles ).toHaveBeenCalledWith( 'p1', 2, 10, expect.anything() )
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

    it( 'reports a 503 on creation globally', () => {
        // Arrange
        createVehicle.mockReturnValue( failing( ERROR_503 ) )

        // Act
        facade.createVehicle( {} as never ).subscribe()

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
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
} )

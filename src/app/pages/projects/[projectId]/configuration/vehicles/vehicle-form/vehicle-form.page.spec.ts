import { Location } from '@angular/common'
import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of, throwError } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehicleFormPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle-form.page'
import { VehicleFormModel } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle.form'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { VEHICLE_DTO } from '@shared/helpers/testing/response-fixtures'

interface PageApi {
    submit: () => void
    model: { (): VehicleFormModel, set: (value: VehicleFormModel) => void }
    error: () => unknown
}

const FILLED: VehicleFormModel = { licensePlate: 'AB-123-CD', brand: 'Ford', model: 'T', beginDateTime: null, endDateTime: null }

describe( 'VehicleFormPage', () => {
    let facade: Record<string, Mock>
    let back: Mock<() => void>

    function create (id: string | undefined): PageApi {
        facade = autoMock()
        back = vi.fn()
        facade[ 'fetchVehicle' ].mockReturnValue( of( VEHICLE_DTO ) )
        facade[ 'updateVehicle' ].mockReturnValue( of( VEHICLE_DTO ) )
        facade[ 'createVehicle' ].mockReturnValue( of( VEHICLE_DTO ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: VehicleFacade, useValue: facade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { vehicleId: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: signal( undefined ), currentUser: (): undefined => undefined } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: RegistryFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( VehicleFormPage, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( VehicleFormPage ).componentInstance as unknown as PageApi
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    it( 'does not save an empty form', () => {
        // Arrange
        const page: PageApi = create( undefined )

        // Act
        page.submit()

        // Assert
        expect( facade[ 'createVehicle' ] ).not.toHaveBeenCalled()
        expect( facade[ 'updateVehicle' ] ).not.toHaveBeenCalled()
    } )

    it( 'loads the vehicle to edit and fills the form with it', () => {
        // Arrange
        const id: string = 'v1'

        // Act
        const page: PageApi = create( id )

        // Assert
        expect( facade[ 'fetchVehicle' ] ).toHaveBeenCalledWith( id )
        expect( page.model() ).toEqual( { ...FILLED, licensePlate: 'AB-123' } )
    } )

    it( 'updates the vehicle with its id and the form values, then goes back', () => {
        // Arrange
        const page: PageApi = create( 'v1' )

        // Act
        page.submit()

        // Assert
        expect( facade[ 'updateVehicle' ] ).toHaveBeenCalledWith( 'v1', expect.objectContaining( { licensePlate: 'AB-123', brand: 'Ford', model: 'T' } ) )
        expect( facade[ 'createVehicle' ] ).not.toHaveBeenCalled()
        expect( back ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'creates a vehicle from the filled form', () => {
        // Arrange
        const page: PageApi = create( undefined )
        page.model.set( FILLED )

        // Act
        page.submit()

        // Assert
        expect( facade[ 'createVehicle' ] ).toHaveBeenCalledWith( expect.objectContaining( { licensePlate: 'AB-123-CD', brand: 'Ford', model: 'T' } ) )
        expect( facade[ 'updateVehicle' ] ).not.toHaveBeenCalled()
    } )

    it( 'shows the error of a failed save and stays on the page', () => {
        // Arrange
        const page: PageApi = create( undefined )
        facade[ 'createVehicle' ].mockReturnValue( throwError( (): object => ({ title: 'T' }) ) )
        page.model.set( FILLED )

        // Act
        page.submit()

        // Assert
        expect( back ).not.toHaveBeenCalled()
        expect( page.error() ).toEqual( { title: 'T' } )
    } )
} )

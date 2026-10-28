import { signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder, ngMocks } from 'ng-mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VEHICLE_DTO } from '@shared/helpers/testing/response-fixtures'
import { VehicleMapper } from '@shared/mappers/vehicle.mapper'
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { VehiclesMonitoringPage } from './vehicles-monitoring.page'

describe( 'VehiclesMonitoringPage', () => {
    let fixture: ComponentFixture<VehiclesMonitoringPage>
    let facade: Record<string, unknown>

    beforeEach( async () => {
        facade = {
            vehiclesPage: signal( undefined ), vehiclesPageLoading: signal( false ), vehiclesPageSilentLoading: signal( false ), vehiclesPageError: signal( undefined ),
            vehiclesPageQueryParam: signal( undefined ), vehiclesPageStatusParam: signal( undefined ), vehiclesPageAtParam: signal( undefined ),
            presencesStatusMetadata: signal( [] ), fetchVehiclesPage: vi.fn(), inputPageSearchParameters: vi.fn(),
        }
        await MockBuilder( VehiclesMonitoringPage )
            .mock( TranslocoPipe, (key: string): string => key )
            .provide( { provide: VehicleFacade, useValue: facade } )
        fixture = TestBed.createComponent( VehiclesMonitoringPage )
        fixture.detectChanges()
    } )

    it( 'loads the first batch of vehicles when displayed', () => {
        // Arrange
        const expected: unknown[] = [ undefined, 20 ]

        // Act
        const requested: unknown = (facade[ 'fetchVehiclesPage' ] as ReturnType<typeof vi.fn>).mock.calls[ 0 ]

        // Assert
        expect( requested ).toEqual( expected )
    } )

    it( 'hides the link of the counters, which already lead to this page', () => {
        // Arrange
        const selector: string = 'app-project-vehicle-overview'

        // Act
        const showLink: boolean = ngMocks.input( selector, 'showLink' )

        // Assert
        expect( showLink ).toBe( false )
    } )

    it( 'searches the vehicles from the first batch with the filters of the form', () => {
        // Arrange
        fixture.componentInstance[ 'model' ].set( { q: 'ford', at: null, status: 'OUT', isVisible: '' } )

        // Act
        fixture.componentInstance[ 'search' ]()

        // Assert
        expect( facade[ 'inputPageSearchParameters' ] ).toHaveBeenCalledWith( 'ford', undefined, 'OUT', undefined )
        expect( facade[ 'fetchVehiclesPage' ] ).toHaveBeenLastCalledWith( 0, 20 )
    } )

    it( 'clears the filters of the form before searching again', () => {
        // Arrange
        fixture.componentInstance[ 'model' ].set( { q: 'ford', at: null, status: 'OUT', isVisible: '' } )

        // Act
        fixture.componentInstance[ 'resetFilters' ]()

        // Assert
        expect( facade[ 'inputPageSearchParameters' ] ).toHaveBeenLastCalledWith( undefined, undefined, undefined, undefined )
    } )

    it( 'fetches the requested batch when the list asks for one', () => {
        // Arrange
        const request: { page: number, size: number } = { page: 2, size: 20 }

        // Act
        ngMocks.output( 'app-list', 'updateRequired' ).emit( request )

        // Assert
        expect( facade[ 'fetchVehiclesPage' ] ).toHaveBeenLastCalledWith( 2, 20 )
    } )

    it( 'hands the page, the loading and the error of the facade to the list', () => {
        // Arrange
        const selector: string = 'app-list'

        // Act
        const label: string = ngMocks.input( selector, 'label' )
        const loading: boolean = ngMocks.input( selector, 'loading' )

        // Assert
        expect( label ).toBe( 'projectHome.vehiclesPage.title' )
        expect( loading ).toBe( false )
    } )

    it( 'turns a vehicle into a status row', () => {
        // Arrange
        const vehicle: VehicleModel = VehicleMapper.toModel( VEHICLE_DTO )

        // Act
        const row: MonitoringRowModel = fixture.componentInstance[ 'rowOf' ]( vehicle )

        // Assert
        expect( row.title ).toBe( 'Ford T' )
        expect( row.statusVariant ).toBe( 'success' )
    } )
} )

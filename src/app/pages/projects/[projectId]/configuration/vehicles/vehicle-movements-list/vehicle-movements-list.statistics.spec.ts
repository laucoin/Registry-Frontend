import { signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { BehaviorSubject, of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehicleMovementsListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-movements-list.page'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { NotificationModel } from '@shared/models/model/notification.model'
import { VehicleTimelineModel } from '@shared/models/model/vehicle-timeline.model'

const TIMELINE: VehicleTimelineModel = { planned: [], actual: [], outSeconds: 8100, usageRate: 0.25 }

interface StatElement extends HTMLElement {
    title: string
    hint: string
    loading: boolean
}

describe( 'VehicleMovementsListPage statistics', () => {
    let fixture: ComponentFixture<VehicleMovementsListPage>
    let timeline: WritableSignal<VehicleTimelineModel | undefined>
    let loading: WritableSignal<boolean>
    let error: WritableSignal<NotificationModel | undefined>

    function stat (testId: string): StatElement {
        return fixture.nativeElement.querySelector( `[data-testid="${testId}"]` )
    }

    function value<T> (testId: string, tag: string): T | undefined {
        return (stat( testId ).querySelector( tag ) as unknown as { value: T } | null)?.value
    }

    beforeEach( async () => {
        timeline = signal<VehicleTimelineModel | undefined>( TIMELINE )
        loading = signal( false )
        error = signal<NotificationModel | undefined>( undefined )
        const facade: Record<string, unknown> = {
            vehicleTimeline: timeline, vehicleTimelineLoading: loading, vehicleTimelineError: error,
            vehicleMovementsPage: signal( undefined ), vehicleMovementsPageLoading: signal( false ), vehicleMovementsPageSilentLoading: signal( false ), vehicleMovementsPageError: signal( undefined ),
            vehicleMovementsPageTypeParam: signal( undefined ), vehicleMovementsPageFromParam: signal( undefined ), vehicleMovementsPageToParam: signal( undefined ), vehicleMovementsPageIsVisibleParam: signal( undefined ),
            fetchVehicle: vi.fn( () => of( { licensePlate: 'AA-111-AA' } ) ), fetchVehicleTimeline: vi.fn(), fetchVehicleMovementsPage: vi.fn(),
            reloadVehicleTimeline: vi.fn(), reloadVehicleMovementsPage: vi.fn(), inputMovementsPageSearchParameters: vi.fn(),
        }
        await MockBuilder( VehicleMovementsListPage )
            .mock( TranslocoPipe, (key: string): string => key )
            .provide( { provide: VehicleFacade, useValue: facade } )
            .provide( { provide: MovementFacade, useValue: { handleMovementFirstPageReload: (): Subject<void> => new Subject<void>(), handleMovementCurrentPageReload: (): Subject<void> => new Subject<void>(), movementTypesMetadata: signal( [] ), visibilitiesMetadata: signal( [] ) } } )
            .provide( { provide: SessionFacade, useValue: { selectedProject: signal( undefined ) } } )
            .provide( { provide: ActivatedRoute, useValue: { paramMap: new BehaviorSubject( convertToParamMap( { vehicleId: 'v1' } ) ), queryParamMap: of( convertToParamMap( {} ) ), snapshot: { params: { vehicleId: 'v1' }, queryParamMap: convertToParamMap( {} ) } } } )
        fixture = TestBed.createComponent( VehicleMovementsListPage )
        fixture.detectChanges()
    } )

    it( 'shows the time out as an ISO duration with its hint', () => {
        // Arrange

        // Act
        const out: StatElement = stat( 'vehicle-movements-list-out-stat' )

        // Assert
        expect( out.title ).toBe( 'vehicles.statistics.out.title' )
        expect( out.hint ).toBe( 'vehicles.statistics.out.hint' )
        expect( value<string>( 'vehicle-movements-list-out-stat', 'sgdf-format-duration' ) ).toBe( 'PT2H15M' )
    } )

    it( 'shows the usage rate as a percentage with its hint', () => {
        // Arrange

        // Act
        const usage: StatElement = stat( 'vehicle-movements-list-usage-stat' )

        // Assert
        expect( usage.hint ).toBe( 'vehicles.statistics.usage.hint' )
        expect( value<number>( 'vehicle-movements-list-usage-stat', 'sgdf-format-number' ) ).toBe( 0.25 )
    } )

    it( 'shows a usage rate of zero as a value and not as missing data', () => {
        // Arrange
        timeline.set( { ...TIMELINE, usageRate: 0 } )

        // Act
        fixture.detectChanges()

        // Assert
        expect( value<number>( 'vehicle-movements-list-usage-stat', 'sgdf-format-number' ) ).toBe( 0 )
    } )

    it( 'explains why there is no usage rate and still shows the time out', () => {
        // Arrange
        timeline.set( { ...TIMELINE, usageRate: undefined } )

        // Act
        fixture.detectChanges()

        // Assert
        expect( stat( 'vehicle-movements-list-usage-stat' ).hint ).toBe( 'vehicles.statistics.usage.empty' )
        expect( value<number>( 'vehicle-movements-list-usage-stat', 'sgdf-format-number' ) ).toBeUndefined()
        expect( value<string>( 'vehicle-movements-list-out-stat', 'sgdf-format-duration' ) ).toBe( 'PT2H15M' )
    } )

    it( 'shows no hint and no value before the timeline is loaded, and flags the statistics as loading', () => {
        // Arrange
        timeline.set( undefined )
        loading.set( true )

        // Act
        fixture.detectChanges()

        // Assert
        expect( stat( 'vehicle-movements-list-out-stat' ).hint ).toBe( '' )
        expect( stat( 'vehicle-movements-list-usage-stat' ).hint ).toBe( '' )
        expect( stat( 'vehicle-movements-list-out-stat' ).loading ).toBe( true )
        expect( value<string>( 'vehicle-movements-list-out-stat', 'sgdf-format-duration' ) ).toBeUndefined()
    } )

    it( 'hides the statistics when the timeline fails, the failure being shown by the timeline', () => {
        // Arrange
        error.set( { summary: 'Unavailable', detail: 'Try later' } )

        // Act
        fixture.detectChanges()

        // Assert
        expect( fixture.nativeElement.querySelector( '[data-testid="vehicle-movements-list-statistics-section"]' ) ).toBeNull()
    } )
} )

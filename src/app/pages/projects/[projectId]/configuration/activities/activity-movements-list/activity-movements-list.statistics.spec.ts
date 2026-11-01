import { signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder, ngMocks } from 'ng-mocks'
import { BehaviorSubject, of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ActivityMovementsListPage } from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-movements-list.page'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ActivityStatisticsModel } from '@shared/models/model/activity-statistics.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'

const STATISTICS: ActivityStatisticsModel = { participantCount: 3, projectParticipantCount: 12, participantRate: 0.25, movementSeconds: 8100, manSeconds: 2203200 }

interface StatElement extends HTMLElement {
    title: string
    hint: string
    loading: boolean
}

describe( 'ActivityMovementsListPage statistics', () => {
    let fixture: ComponentFixture<ActivityMovementsListPage>
    let statistics: WritableSignal<ActivityStatisticsModel | undefined>
    let loading: WritableSignal<boolean>
    let error: WritableSignal<NotificationModel | undefined>
    let facade: Record<string, unknown>

    function stat (testId: string): StatElement {
        return fixture.nativeElement.querySelector( `[data-testid="${testId}"]` )
    }

    function value<T> (testId: string, tag: string): T | undefined {
        return (stat( testId ).querySelector( tag ) as unknown as { value: T } | null)?.value
    }

    beforeEach( async () => {
        statistics = signal<ActivityStatisticsModel | undefined>( STATISTICS )
        loading = signal( false )
        error = signal<NotificationModel | undefined>( undefined )
        facade = {
            activityStatistics: statistics, activityStatisticsLoading: loading, activityStatisticsError: error,
            activityMovementsPage: signal( undefined ), activityMovementsPageLoading: signal( false ), activityMovementsPageSilentLoading: signal( false ), activityMovementsPageError: signal( undefined ),
            activityMovementsPageTypeParam: signal( undefined ), activityMovementsPageFromParam: signal( undefined ), activityMovementsPageToParam: signal( undefined ), activityMovementsPageIsVisibleParam: signal( undefined ),
            fetchActivity: vi.fn( () => of( { name: 'Hike' } ) ), fetchActivityStatistics: vi.fn(), fetchActivityMovementsPage: vi.fn(),
            reloadActivityStatistics: vi.fn(), reloadActivityMovementsPage: vi.fn(), inputMovementsPageSearchParameters: vi.fn(),
        }
        await MockBuilder( ActivityMovementsListPage )
            .mock( TranslocoPipe, (key: string, params?: object): string => params ? `${key}:${JSON.stringify( params )}` : key )
            .provide( { provide: ActivityFacade, useValue: facade } )
            .provide( { provide: MovementFacade, useValue: { handleMovementFirstPageReload: (): Subject<void> => new Subject<void>(), handleMovementCurrentPageReload: (): Subject<void> => new Subject<void>(), movementTypesMetadata: signal( [] ), visibilitiesMetadata: signal( [] ) } } )
            .provide( { provide: ActivatedRoute, useValue: { paramMap: new BehaviorSubject( convertToParamMap( { activityId: 'a1' } ) ), snapshot: { params: { activityId: 'a1' } } } } )
        fixture = TestBed.createComponent( ActivityMovementsListPage )
        fixture.detectChanges()
    } )

    it( 'shows the participation as a percentage and says how many participants it is', () => {
        // Arrange

        // Act
        const participation: StatElement = stat( 'activity-movements-list-participation-stat' )

        // Assert
        expect( participation.hint ).toBe( 'activities.statistics.participation.hint:{"count":3,"total":12}' )
        expect( value<number>( 'activity-movements-list-participation-stat', 'sgdf-format-number' ) ).toBe( 0.25 )
    } )

    it( 'shows a participation of zero as a value and not as missing data', () => {
        // Arrange
        statistics.set( { ...STATISTICS, participantCount: 0, participantRate: 0 } )

        // Act
        fixture.detectChanges()

        // Assert
        expect( value<number>( 'activity-movements-list-participation-stat', 'sgdf-format-number' ) ).toBe( 0 )
    } )

    it( 'explains that the project has no participant and still shows the durations', () => {
        // Arrange
        statistics.set( { ...STATISTICS, projectParticipantCount: 0, participantRate: undefined } )

        // Act
        fixture.detectChanges()

        // Assert
        expect( stat( 'activity-movements-list-participation-stat' ).hint ).toContain( 'activities.statistics.participation.empty' )
        expect( value<number>( 'activity-movements-list-participation-stat', 'sgdf-format-number' ) ).toBeUndefined()
        expect( value<string>( 'activity-movements-list-movement-stat', 'sgdf-format-duration' ) ).toBe( 'PT2H15M' )
    } )

    it( 'writes the time out and the man time in hours, not in days', () => {
        // Arrange

        // Act
        const durations: (string | undefined)[] = [
            value<string>( 'activity-movements-list-movement-stat', 'sgdf-format-duration' ),
            value<string>( 'activity-movements-list-man-stat', 'sgdf-format-duration' ),
        ]

        // Assert
        expect( durations ).toEqual( [ 'PT2H15M', 'PT612H' ] )
        expect( stat( 'activity-movements-list-man-stat' ).title ).toBe( 'activities.statistics.man.title' )
    } )

    it( 'shows no hint and no value before the statistics are loaded, and flags them as loading', () => {
        // Arrange
        statistics.set( undefined )
        loading.set( true )

        // Act
        fixture.detectChanges()

        // Assert
        expect( stat( 'activity-movements-list-participation-stat' ).hint ).toBe( '' )
        expect( stat( 'activity-movements-list-man-stat' ).hint ).toBe( '' )
        expect( stat( 'activity-movements-list-movement-stat' ).loading ).toBe( true )
        expect( value<string>( 'activity-movements-list-man-stat', 'sgdf-format-duration' ) ).toBeUndefined()
    } )

    it( 'replaces the statistics with the failure and retries when asked', () => {
        // Arrange
        error.set( { summary: 'Unavailable', detail: 'Try later' } )
        fixture.detectChanges()

        // Act
        ngMocks.output( ngMocks.find( SectionErrorComponent ), 'retry' ).emit()

        // Assert
        expect( stat( 'activity-movements-list-man-stat' ) ).toBeNull()
        expect( facade[ 'fetchActivityStatistics' ] ).toHaveBeenCalledTimes( 2 )
    } )
} )

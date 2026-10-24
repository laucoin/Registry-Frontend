import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ActivityStore } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.store'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ERROR_500, ERROR_503, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { ActivityModel } from '@shared/models/model/activity.model'
import { ErrorModel } from '@shared/models/model/error.model'

describe( 'ActivityFacade', () => {
    let facade: ActivityFacade
    let findActivities: Mock<ActivityApi['findActivities']>
    let createActivity: Mock<ActivityApi['createActivity']>
    let disableActivityById: Mock<ActivityApi['disableActivityById']>
    let deleteActivityById: Mock<ActivityApi['deleteActivityById']>
    let api: Record<string, Mock>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        provideTestConfig()
        findActivities = vi.fn( () => of( pageOf<ActivityModel>( [], 2 ) ) )
        createActivity = vi.fn()
        disableActivityById = vi.fn()
        deleteActivityById = vi.fn()
        api = { findActivityById: vi.fn(), updateActivityById: vi.fn(), enableActivityById: vi.fn() }
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                ActivityFacade,
                ActivityStore,
                { provide: ActivityApi, useValue: { findActivities, createActivity, disableActivityById, deleteActivityById, ...api } },
                { provide: MovementApi, useValue: { findMovementsContents: vi.fn( () => of( [] ) ) } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
            ],
        } )
        facade = TestBed.inject( ActivityFacade )
        facade.fetchActivitiesPage( 2, 10 )
        findActivities.mockClear()
    } )

    it( 'fetches the requested page for the selected project', () => {
        // Arrange
        const page: number = 3

        // Act
        facade.fetchActivitiesPage( page, 10 )

        // Assert
        expect( findActivities ).toHaveBeenCalledWith( 'p1', 3, 10, expect.anything() )
    } )

    it( 'restarts from the first page when the search changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'camp', undefined, undefined, undefined )

        // Act
        facade.fetchActivitiesPage( 4, 10 )

        // Assert
        expect( findActivities ).toHaveBeenCalledWith( 'p1', 0, 10, expect.anything() )
    } )

    it( 'translates availability and visibility labels except the empty option', () => {
        // Arrange
        const expected: (string | undefined)[] = [ '-', 't:activities.available.true', 't:activities.available.false' ]

        // Act
        const labels: (string | undefined)[] = facade.availabilitiesMetadata().map( (item: { label?: string }): string | undefined => item.label )

        // Assert
        expect( labels ).toEqual( expected )
    } )

    it( 'notifies and refreshes the current page after a creation', () => {
        // Arrange
        createActivity.mockReturnValue( of( { id: 'a1', name: 'Hike' } as ActivityModel ) )

        // Act
        facade.createActivity( {} as never ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'activities.notifications.create.title' } ) )
        expect( findActivities ).toHaveBeenCalledWith( 'p1', 0, 30, expect.anything() )
    } )

    it( 'lets the form handle a creation error other than 503', () => {
        // Arrange
        createActivity.mockReturnValue( failing( ERROR_500 ) )
        let received: ErrorModel | undefined

        // Act
        facade.createActivity( {} as never ).subscribe( { error: (error: ErrorModel): void => { received = error } } )

        // Assert
        expect( received ).toBe( ERROR_500 )
        expect( notify ).not.toHaveBeenCalled()
        expect( findActivities ).not.toHaveBeenCalled()
    } )

    it( 'rethrows a 503 on creation for the form to display', () => {
        // Arrange
        createActivity.mockReturnValue( failing( ERROR_503 ) )
        let received: unknown

        // Act
        facade.createActivity( {} as never ).subscribe( { error: (error: unknown): void => { received = error } } )

        // Assert
        expect( received ).toBe( ERROR_503 )
    } )

    it( 'notifies a failed command instead of rethrowing it', () => {
        // Arrange
        disableActivityById.mockReturnValue( failing( ERROR_500 ) )
        let completed: boolean = false

        // Act
        facade.disableActivity( 'a1' ).subscribe( { complete: (): void => { completed = true } } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( completed ).toBe( true )
    } )

    it( 'announces the deletion on the command channel', () => {
        // Arrange
        deleteActivityById.mockReturnValue( of( undefined ) )

        // Act
        facade.deleteActivity( { id: 'a1', name: 'Hike' } as ActivityModel ).subscribe()

        // Assert
        expect( deleteActivityById ).toHaveBeenCalledWith( undefined, 'a1' )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'activities.notifications.delete.title' } ) )
    } )

    it( 'reloads every shown batch of the movements of an activity in one request', () => {
        // Arrange
        const finder: Mock = vi.fn( () => of( pageOf<never>( [], 1 ) ) )
        ;(TestBed.inject( ActivityApi ) as unknown as Record<string, Mock>)[ 'findActivityMovements' ] = finder
        facade.fetchActivityMovementsPage( 'e1', 1, 10 )
        finder.mockClear()

        // Act
        facade.reloadActivityMovementsPage( 'e1' )

        // Assert
        expect( finder ).toHaveBeenCalledWith( 'p1', 'e1', 0, expect.any( Number ), expect.anything() )
    } )

    it( 'fetches an activity of the selected project', () => {
        // Arrange
        api[ 'findActivityById' ].mockReturnValue( of( { id: 'a1' } as ActivityModel ) )
        let received: ActivityModel | undefined

        // Act
        facade.fetchActivity( 'a1' ).subscribe( (it: ActivityModel): void => { received = it } )

        // Assert
        expect( api[ 'findActivityById' ] ).toHaveBeenCalledWith( 'p1', 'a1' )
        expect( received?.id ).toBe( 'a1' )
    } )

    it( 'notifies a failed activity fetch', () => {
        // Arrange
        api[ 'findActivityById' ].mockReturnValue( failing( ERROR_500 ) )

        // Act
        facade.fetchActivity( 'a1' ).subscribe( { error: (): void => undefined } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
    } )

    it( 'sends the version of the activity on update and announces the edition', () => {
        // Arrange
        api[ 'updateActivityById' ].mockReturnValue( of( { id: 'a1', name: 'Hike' } as ActivityModel ) )

        // Act
        facade.updateActivity( 'a1', {} as never, 'etag-1' ).subscribe()

        // Assert
        expect( api[ 'updateActivityById' ] ).toHaveBeenCalledWith( 'p1', 'a1', {}, 'etag-1' )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'activities.notifications.edit.title' } ) )
        expect( findActivities ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'notifies and refreshes the page after the activity is enabled', () => {
        // Arrange
        api[ 'enableActivityById' ].mockReturnValue( of( { id: 'a1', name: 'Hike' } as ActivityModel ) )

        // Act
        facade.enableActivity( 'a1' ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'activities.notifications.enable.title' } ) )
        expect( findActivities ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'restarts the movements from the first page when their search changed', () => {
        // Arrange
        const finder: Mock = vi.fn( () => of( pageOf<never>( [], 1 ) ) )
        ;(TestBed.inject( ActivityApi ) as unknown as Record<string, Mock>)[ 'findActivityMovements' ] = finder
        facade.inputMovementsPageSearchParameters( 'OUT', new Date( '2026-01-01T00:00:00.000Z' ), undefined, true )

        // Act
        facade.fetchActivityMovementsPage( 'a1', 4, 10 )

        // Assert
        expect( finder ).toHaveBeenCalledWith( 'p1', 'a1', 0, 10, expect.anything() )
        expect( facade.activityMovementsPageTypeParam() ).toBe( 'OUT' )
    } )

    it( 'keeps the activities search when the same values are input again', () => {
        // Arrange
        facade.inputPageSearchParameters( 'hike', undefined, true, undefined )

        // Act
        facade.inputPageSearchParameters( 'hike', undefined, true, undefined )

        // Assert
        expect( facade.activitiesPageQueryParam() ).toBe( 'hike' )
        expect( facade.activitiesPageIsAvailableParam() ).toBe( true )
    } )
} )

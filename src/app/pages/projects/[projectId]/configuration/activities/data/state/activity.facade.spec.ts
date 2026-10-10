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
    let notify: Mock<(message: unknown) => void>
    let setGlobalError: Mock<(error: ErrorModel) => void>

    beforeEach( () => {
        provideTestConfig()
        findActivities = vi.fn( () => of( pageOf<ActivityModel>( [], 2 ) ) )
        createActivity = vi.fn()
        disableActivityById = vi.fn()
        deleteActivityById = vi.fn()
        notify = vi.fn()
        setGlobalError = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                ActivityFacade,
                ActivityStore,
                { provide: ActivityApi, useValue: { findActivities, createActivity, disableActivityById, deleteActivityById } },
                { provide: MovementApi, useValue: { findMovementsContents: vi.fn( () => of( [] ) ) } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify, setGlobalError } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
            ],
        } )
        facade = TestBed.inject( ActivityFacade )
        facade.fetchActivitiesPage( 2, 10 )
        findActivities.mockClear()
    } )

    it( 'fetches the requested page for the selected project', () => {
        // Arrange
        const pageNumber: number = 3

        // Act
        facade.fetchActivitiesPage( pageNumber, 10 )

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
        expect( findActivities ).toHaveBeenCalledWith( 'p1', 2, 10, expect.anything() )
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

    it( 'reports a 503 on creation globally and completes silently', () => {
        // Arrange
        createActivity.mockReturnValue( failing( ERROR_503 ) )
        let completed: boolean = false

        // Act
        facade.createActivity( {} as never ).subscribe( { complete: (): void => { completed = true } } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
        expect( completed ).toBe( true )
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
} )

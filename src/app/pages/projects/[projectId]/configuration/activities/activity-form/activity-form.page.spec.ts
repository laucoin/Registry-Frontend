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
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ActivityFormPage } from '@pages/projects/[projectId]/configuration/activities/activity-form/activity-form.page'
import { ActivityFormModel } from '@pages/projects/[projectId]/configuration/activities/activity-form/activity.form'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { ACTIVITY_DTO } from '@shared/helpers/testing/response-fixtures'

interface PageApi {
    submit: () => void
    model: { (): ActivityFormModel, set: (value: ActivityFormModel) => void }
    error: () => unknown
}

const FILLED: ActivityFormModel = { name: 'Hike', description: 'd', duration: { hours: 2, minutes: 0 }, allowedParticipants: { lower: 1, upper: 5 }, beginDateTime: null, endDateTime: null }

describe( 'ActivityFormPage', () => {
    let facade: Record<string, Mock>
    let back: Mock<() => void>

    function create (id: string | undefined): PageApi {
        facade = autoMock()
        back = vi.fn()
        facade[ 'fetchActivity' ].mockReturnValue( of( ACTIVITY_DTO ) )
        facade[ 'updateActivity' ].mockReturnValue( of( ACTIVITY_DTO ) )
        facade[ 'createActivity' ].mockReturnValue( of( ACTIVITY_DTO ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] }, hosting: { providerName: null, providerAddress: null } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: ActivityFacade, useValue: facade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { activityId: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: signal( undefined ), currentUser: (): undefined => undefined } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: RegistryFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( ActivityFormPage, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( ActivityFormPage ).componentInstance as unknown as PageApi
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
        expect( facade[ 'createActivity' ] ).not.toHaveBeenCalled()
        expect( facade[ 'updateActivity' ] ).not.toHaveBeenCalled()
    } )

    it( 'loads the activity to edit and fills the form with it', () => {
        // Arrange
        const id: string = 'a1'

        // Act
        const page: PageApi = create( id )

        // Assert
        expect( facade[ 'fetchActivity' ] ).toHaveBeenCalledWith( id )
        expect( page.model() ).toEqual( FILLED )
    } )

    it( 'updates the activity with its id and the form values, then goes back', () => {
        // Arrange
        const page: PageApi = create( 'a1' )

        // Act
        page.submit()

        // Assert
        expect( facade[ 'updateActivity' ] ).toHaveBeenCalledWith( 'a1', expect.objectContaining( { name: 'Hike', description: 'd', duration: 'PT2H', allowedParticipants: { lower: 1, upper: 5 } } ) )
        expect( facade[ 'createActivity' ] ).not.toHaveBeenCalled()
        expect( back ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'creates a activity from the filled form', () => {
        // Arrange
        const page: PageApi = create( undefined )
        page.model.set( FILLED )

        // Act
        page.submit()

        // Assert
        expect( facade[ 'createActivity' ] ).toHaveBeenCalledWith( expect.objectContaining( { name: 'Hike', description: 'd', duration: 'PT2H', allowedParticipants: { lower: 1, upper: 5 } } ) )
        expect( facade[ 'updateActivity' ] ).not.toHaveBeenCalled()
    } )

    it( 'shows the error of a failed save and stays on the page', () => {
        // Arrange
        const page: PageApi = create( undefined )
        facade[ 'createActivity' ].mockReturnValue( throwError( (): object => ({ title: 'T' }) ) )
        page.model.set( FILLED )

        // Act
        page.submit()

        // Assert
        expect( back ).not.toHaveBeenCalled()
        expect( page.error() ).toEqual( { title: 'T' } )
    } )
} )

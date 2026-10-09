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
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupFormPage } from '@pages/projects/[projectId]/configuration/groups/group-form/group-form.page'
import { GroupFormModel } from '@pages/projects/[projectId]/configuration/groups/group-form/group.form'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { GROUP_DTO, PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures'

interface PageApi {
    submit: () => void
    model: { (): GroupFormModel, set: (value: GroupFormModel) => void }
    error: () => unknown
}

const FILLED: GroupFormModel = { name: 'Wolves', beginDateTime: null, endDateTime: null, participants: [ PARTICIPANT_DTO as never ] }

describe( 'GroupFormPage', () => {
    let facade: Record<string, Mock>
    let back: Mock<() => void>

    function create (id: string | undefined): PageApi {
        facade = autoMock()
        back = vi.fn()
        facade[ 'fetchGroup' ].mockReturnValue( of( { ...GROUP_DTO, members: [ PARTICIPANT_DTO ] } ) )
        facade[ 'updateGroup' ].mockReturnValue( of( GROUP_DTO ) )
        facade[ 'createGroup' ].mockReturnValue( of( GROUP_DTO ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: GroupFacade, useValue: facade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { groupId: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: signal( undefined ), currentUser: (): undefined => undefined } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: RegistryFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( GroupFormPage, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( GroupFormPage ).componentInstance as unknown as PageApi
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
        expect( facade[ 'createGroup' ] ).not.toHaveBeenCalled()
        expect( facade[ 'updateGroup' ] ).not.toHaveBeenCalled()
    } )

    it( 'loads the group to edit and fills the form with it', () => {
        // Arrange
        const id: string = 'g1'

        // Act
        const page: PageApi = create( id )

        // Assert
        expect( facade[ 'fetchGroup' ] ).toHaveBeenCalledWith( id )
        expect( page.model() ).toEqual( FILLED )
    } )

    it( 'updates the group with its id and the form values, then goes back', () => {
        // Arrange
        const page: PageApi = create( 'g1' )

        // Act
        page.submit()

        // Assert
        expect( facade[ 'updateGroup' ] ).toHaveBeenCalledWith( 'g1', expect.objectContaining( { name: 'Wolves', members: [ 'pa1' ] } ) )
        expect( facade[ 'createGroup' ] ).not.toHaveBeenCalled()
        expect( back ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'creates a group from the filled form', () => {
        // Arrange
        const page: PageApi = create( undefined )
        page.model.set( FILLED )

        // Act
        page.submit()

        // Assert
        expect( facade[ 'createGroup' ] ).toHaveBeenCalledWith( expect.objectContaining( { name: 'Wolves', members: [ 'pa1' ] } ) )
        expect( facade[ 'updateGroup' ] ).not.toHaveBeenCalled()
    } )

    it( 'shows the error of a failed save and stays on the page', () => {
        // Arrange
        const page: PageApi = create( undefined )
        facade[ 'createGroup' ].mockReturnValue( throwError( (): object => ({ title: 'T' }) ) )
        page.model.set( FILLED )

        // Act
        page.submit()

        // Assert
        expect( back ).not.toHaveBeenCalled()
        expect( page.error() ).toEqual( { title: 'T' } )
    } )
} )

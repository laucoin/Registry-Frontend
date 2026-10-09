import { Location } from '@angular/common'
import { Type } from '@angular/core'
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
import { ActivityFormPage } from '@pages/projects/[projectId]/configuration/activities/activity-form/activity-form.page'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupFormPage } from '@pages/projects/[projectId]/configuration/groups/group-form/group-form.page'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { ACTIVITY_DTO, GROUP_DTO, PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures'
import { GenericFormComponent } from '@shared/ui/base/generic-form.component'

interface FormCase {
    name: string
    type: Type<GenericFormComponent<unknown, unknown>>
    facade: Type<unknown>
    param: string
    fetch: string
    create: string
    update: string
    model: object
    dto: object
}

const CASES: FormCase[] = [
    { name: 'activity', type: ActivityFormPage, facade: ActivityFacade, param: 'activityId', fetch: 'fetchActivity', create: 'createActivity', update: 'updateActivity',
        model: ACTIVITY_DTO, dto: { name: 'Hike', description: 'd', duration: 'PT2H', allowedParticipants: { lower: 1, upper: 5 } } },
    { name: 'group', type: GroupFormPage, facade: GroupFacade, param: 'groupId', fetch: 'fetchGroup', create: 'createGroup', update: 'updateGroup',
        model: { ...GROUP_DTO, members: [ PARTICIPANT_DTO ] }, dto: { name: 'Wolves', members: [ 'pa1' ] } },
]

describe( 'form pages', () => {
    let facade: Record<string, Mock>
    let back: Mock<() => void>

    function create (item: FormCase, id: string | undefined): GenericFormComponent<unknown, unknown> {
        facade = autoMock()
        back = vi.fn()
        facade[ item.fetch ].mockReturnValue( of( item.model ) )
        facade[ item.update ].mockReturnValue( of( item.model ) )
        facade[ item.create ].mockReturnValue( of( item.model ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: item.facade, useValue: facade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl: vi.fn( () => Promise.resolve( true ) ) } },
                { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { [ item.param ]: id } : {} } } },
                { provide: SessionFacade, useValue: { selectedProject: (): undefined => undefined, currentUser: (): undefined => undefined } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: RegistryFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( item.type, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( item.type ).componentInstance
    }

    function api (page: GenericFormComponent<unknown, unknown>): { fillForm: (model: object) => void, submit: () => void, buildDto: () => object, form: { value: object, valid: boolean } } {
        return page as never
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    it.each( CASES )( 'does not save an empty $name form', (item: FormCase) => {
        // Arrange
        const page: GenericFormComponent<unknown, unknown> = create( item, undefined )

        // Act
        api( page ).submit()

        // Assert
        expect( facade[ item.create ] ).not.toHaveBeenCalled()
        expect( facade[ item.update ] ).not.toHaveBeenCalled()
    } )

    it.each( CASES )( 'loads the $name to edit and fills the form with it', (item: FormCase) => {
        // Arrange
        const expected: object = item.dto

        // Act
        const page: GenericFormComponent<unknown, unknown> = create( item, 'e1' )

        // Assert
        expect( facade[ item.fetch ] ).toHaveBeenCalledWith( 'e1' )
        expect( api( page ).buildDto() ).toEqual( expect.objectContaining( expected ) )
    } )

    it.each( CASES )( 'updates the $name with its id and the form values, then goes back', (item: FormCase) => {
        // Arrange
        const page: GenericFormComponent<unknown, unknown> = create( item, 'e1' )

        // Act
        api( page ).submit()

        // Assert
        expect( facade[ item.update ] ).toHaveBeenCalledWith( (item.model as { id: string }).id, expect.objectContaining( item.dto ) )
        expect( facade[ item.create ] ).not.toHaveBeenCalled()
        expect( back ).toHaveBeenCalledTimes( 1 )
    } )

    it.each( CASES )( 'creates a $name from the filled form', (item: FormCase) => {
        // Arrange
        const page: GenericFormComponent<unknown, unknown> = create( item, undefined )
        api( page ).fillForm( item.model )

        // Act
        api( page ).submit()

        // Assert
        expect( facade[ item.create ] ).toHaveBeenCalledWith( expect.objectContaining( item.dto ) )
        expect( facade[ item.update ] ).not.toHaveBeenCalled()
    } )

    it.each( CASES )( 'shows the error of a failed $name save and stays on the page', (item: FormCase) => {
        // Arrange
        const page: GenericFormComponent<unknown, unknown> = create( item, undefined )
        facade[ item.create ].mockReturnValue( throwError( (): object => ({ title: 'T' }) ) )
        api( page ).fillForm( item.model )

        // Act
        api( page ).submit()

        // Assert
        expect( back ).not.toHaveBeenCalled()
        expect( (page as unknown as { error: () => unknown }).error() ).toEqual( { title: 'T' } )
    } )
} )

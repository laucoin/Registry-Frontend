import { Location } from '@angular/common'
import { Type } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { BehaviorSubject, of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileEditionFormPage } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-edition-form/project-profile-edition-form.page'
import { ProjectProfileInvitationFormPage } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-form/project-profile-invitation-form.page'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { UserFormPage } from '@pages/users/user-form/user-form.page'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { PROFILE_DTO, USER_DTO } from '@shared/helpers/testing/response-fixtures'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'

interface FormApi {
    submit: () => void
    buildDto: () => unknown
    fillForm: (model: object) => void
    form: { value: object, patchValue: (value: object) => void }
}

interface ModelApi {
    model: { (): object, set: (value: object) => void }
}

describe( 'user and project profile forms', () => {
    let facade: Record<string, Mock>
    let back: Mock<() => void>
    let navigateByUrl: Mock<(url: string) => Promise<boolean>>

    function create<T extends BaseFormComponent> (type: Type<T>, facadeToken: Type<unknown>, params: Record<string, string>): T {
        back = vi.fn()
        navigateByUrl = vi.fn( () => Promise.resolve( true ) )
        RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel
        RegistryConfig.environment = { production: false, backend: { url: 'http://backend.test', noAuthPaths: [] } }
        TestBed.configureTestingModule( {
            providers: [
                { provide: facadeToken, useValue: facade },
                { provide: Location, useValue: { back } },
                { provide: Router, useValue: { navigateByUrl } },
                { provide: ActivatedRoute, useValue: { snapshot: { params } } },
                { provide: SessionFacade, useValue: { selectedProject: (): undefined => undefined, currentUser: (): undefined => undefined } },
                { provide: UiFacade, useValue: autoMock() },
                { provide: RegistryFacade, useValue: autoMock() },
                { provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        TestBed.overrideComponent( type, { set: { template: '', imports: [], providers: [] } } )
        return TestBed.createComponent( type ).componentInstance
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
        facade = autoMock()
    } )

    describe( 'user form', () => {
        it( 'goes back to the users list when no user is given', () => {
            // Arrange
            const params: Record<string, string> = {}
            facade[ 'user$' ] = new BehaviorSubject<unknown>( undefined ) as never

            // Act
            create( UserFormPage, UserFacade, params )

            // Assert
            expect( navigateByUrl ).toHaveBeenCalledWith( RegistryRouteEnum.USERS )
            expect( facade[ 'fetchUser' ] ).not.toHaveBeenCalled()
        } )

        it( 'resets the previous user and loads the user and the assignable roles', () => {
            // Arrange
            const params: Record<string, string> = { userId: 'u1' }
            facade[ 'user$' ] = new BehaviorSubject<unknown>( undefined ) as never

            // Act
            create( UserFormPage, UserFacade, params )

            // Assert
            expect( facade[ 'resetUser' ] ).toHaveBeenCalledTimes( 1 )
            expect( facade[ 'fetchAssignableRoles' ] ).toHaveBeenCalledTimes( 1 )
            expect( facade[ 'fetchUser' ] ).toHaveBeenCalledWith( 'u1' )
        } )

        it( 'fills the role when the user arrives', () => {
            // Arrange
            const user$: BehaviorSubject<unknown> = new BehaviorSubject<unknown>( undefined )
            facade[ 'user$' ] = user$ as never
            const page: UserFormPage = create( UserFormPage, UserFacade, { userId: 'u1' } )

            // Act
            user$.next( USER_DTO )

            // Assert
            expect( (page as unknown as ModelApi).model() ).toEqual( { role: 'ADMIN' } )
        } )

        it( 'does not save without a role', () => {
            // Arrange
            facade[ 'user$' ] = new BehaviorSubject<unknown>( undefined ) as never
            const page: UserFormPage = create( UserFormPage, UserFacade, { userId: 'u1' } )

            // Act
            ;(page as unknown as FormApi).submit()

            // Assert
            expect( facade[ 'updateUserRole' ] ).not.toHaveBeenCalled()
        } )

        it( 'saves the chosen role for the loaded user then goes back', () => {
            // Arrange
            facade[ 'user$' ] = new BehaviorSubject<unknown>( undefined ) as never
            facade[ 'user' ].mockReturnValue( USER_DTO )
            facade[ 'updateUserRole' ].mockReturnValue( of( USER_DTO ) )
            const page: UserFormPage = create( UserFormPage, UserFacade, { userId: 'u1' } )
            ;(page as unknown as ModelApi).model.set( { role: 'CHIEF' } )

            // Act
            ;(page as unknown as FormApi).submit()

            // Assert
            expect( facade[ 'updateUserRole' ] ).toHaveBeenCalledWith( 'u1', 'CHIEF' )
            expect( back ).toHaveBeenCalledTimes( 1 )
        } )
    } )

    describe( 'project profile edition form', () => {
        it( 'loads the assignable roles and the profile to edit and fills the form', () => {
            // Arrange
            facade[ 'fetchProjectProfile' ].mockReturnValue( of( { ...PROFILE_DTO, role: { label: 'Chief', value: 'CHIEF' } } ) )

            // Act
            const page: ProjectProfileEditionFormPage = create( ProjectProfileEditionFormPage, ProjectProfileFacade, { profileId: 'pp1' } )

            // Assert
            expect( facade[ 'fetchAssignableRoles' ] ).toHaveBeenCalledTimes( 1 )
            expect( facade[ 'fetchProjectProfile' ] ).toHaveBeenCalledWith( 'pp1' )
            expect( (page as unknown as FormApi).buildDto() ).toEqual( { role: 'CHIEF', startAccess: undefined, endAccess: undefined } )
        } )

        it( 'updates the profile with the form values then goes back', () => {
            // Arrange
            facade[ 'fetchProjectProfile' ].mockReturnValue( of( PROFILE_DTO ) )
            facade[ 'updateProjectProfile' ].mockReturnValue( of( PROFILE_DTO ) )
            const page: ProjectProfileEditionFormPage = create( ProjectProfileEditionFormPage, ProjectProfileFacade, { profileId: 'pp1' } )

            // Act
            ;(page as unknown as FormApi).submit()

            // Assert
            expect( facade[ 'updateProjectProfile' ] ).toHaveBeenCalledWith( 'pp1', expect.objectContaining( { role: 'CHIEF' } ) )
            expect( back ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'does not save an invalid profile', () => {
            // Arrange
            facade[ 'fetchProjectProfile' ].mockReturnValue( of( { ...PROFILE_DTO, role: { label: '', value: undefined } } ) )
            const page: ProjectProfileEditionFormPage = create( ProjectProfileEditionFormPage, ProjectProfileFacade, { profileId: 'pp1' } )

            // Act
            ;(page as unknown as FormApi).submit()

            // Assert
            expect( facade[ 'updateProjectProfile' ] ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'project profile invitation form', () => {
        it( 'loads the assignable roles and starts empty', () => {
            // Arrange
            const params: Record<string, string> = {}

            // Act
            create( ProjectProfileInvitationFormPage, ProjectProfileFacade, params )

            // Assert
            expect( facade[ 'fetchAssignableRoles' ] ).toHaveBeenCalledTimes( 1 )
            expect( facade[ 'fetchProjectProfile' ] ).not.toHaveBeenCalled()
        } )

        it( 'does not invite without users and a role', () => {
            // Arrange
            const page: ProjectProfileInvitationFormPage = create( ProjectProfileInvitationFormPage, ProjectProfileFacade, {} )

            // Act
            ;(page as unknown as FormApi).submit()

            // Assert
            expect( facade[ 'createProjectProfiles' ] ).not.toHaveBeenCalled()
        } )

        it( 'invites the chosen users with the chosen role and dates then goes back', () => {
            // Arrange
            facade[ 'createProjectProfiles' ].mockReturnValue( of( { createdUserIds: [ 'u1' ], notCreatedUserIds: [] } ) )
            const page: ProjectProfileInvitationFormPage = create( ProjectProfileInvitationFormPage, ProjectProfileFacade, {} )
            ;(page as unknown as FormApi).form.patchValue( { role: 'CHIEF', users: [ USER_DTO ] } )

            // Act
            ;(page as unknown as FormApi).submit()

            // Assert
            expect( facade[ 'createProjectProfiles' ] ).toHaveBeenCalledWith( { userIds: [ 'u1' ], role: 'CHIEF', startAccess: null, endAccess: null } )
            expect( back ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'searches users through the facade', () => {
            // Arrange
            const page: ProjectProfileInvitationFormPage = create( ProjectProfileInvitationFormPage, ProjectProfileFacade, {} )

            // Act
            ;(page as unknown as { handleSearch: (text: string) => void }).handleSearch( 'ada' )

            // Assert
            expect( facade[ 'searchUsers' ] ).toHaveBeenCalledWith( 'ada' )
        } )
    } )
} )

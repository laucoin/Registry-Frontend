import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { SessionStore } from '@core/registry/state/session.store'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { PageModel } from '@shared/models/model/page.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'

const PAGE: PageModel<ProjectProfileModel> = { pageNumber: 1, pageSize: 10, totalElements: 0, totalPages: 1, content: [], lastRefresh: new Date() }

describe( 'SessionFacade', () => {
    let facade: SessionFacade
    let store: InstanceType<typeof SessionStore>
    let findUserProjectProfiles: Mock<UserProjectProfileApi['findUserProjectProfiles']>

    beforeEach( () => {
        RegistryConfig.config = { defaultLanguage: 'fr' } as ConfigModel
        findUserProjectProfiles = vi.fn( () => of( PAGE ) )
        TestBed.configureTestingModule( {
            providers: [
                { provide: UserProjectProfileApi, useValue: { findUserProjectProfiles } },
                { provide: ErrorReporter, useValue: { setGlobalError: vi.fn(), notify: vi.fn() } },
            ],
        } )
        facade = TestBed.inject( SessionFacade )
        store = TestBed.inject( SessionStore )
    } )

    it( 'falls back to the default language when the user has no preference', () => {
        // Arrange
        store.setCurrentUser( { id: 'u1', preferences: {} } as CurrentUserModel )

        // Act
        const language: string = facade.currentUserLanguage()

        // Assert
        expect( language ).toBe( 'fr' )
    } )

    it( 'exposes the project of the selected profile', () => {
        // Arrange
        store.setCurrentProject( 'p1', { id: 'pp1', project: { id: 'p1' } } as ProjectProfileModel )

        // Act
        const projectId: string | undefined = facade.selectedProject()?.id

        // Assert
        expect( projectId ).toBe( 'p1' )
        expect( facade.currentProjectId() ).toBe( 'p1' )
    } )

    it( 'emits the current user once it is known', () => {
        // Arrange
        const emitted: string[] = []
        facade.currentUser$.subscribe( (user: CurrentUserModel): number => emitted.push( user.id ) )

        // Act
        store.setCurrentUser( { id: 'u1' } as CurrentUserModel )

        // Assert
        expect( emitted ).toEqual( [ 'u1' ] )
    } )

    it( 'fetches the requested profiles page', () => {
        // Arrange
        const pageNumber: number = 3

        // Act
        facade.fetchProjectProfilesPage( pageNumber, 10 )

        // Assert
        expect( findUserProjectProfiles ).toHaveBeenCalledWith( 3, 10, expect.anything() )
    } )

    it( 'restarts from the first page after the profiles search changed', () => {
        // Arrange
        facade.inputProfilesPageSearchParameters( 'wolves', undefined, undefined )

        // Act
        facade.fetchProjectProfilesPage( 4, 10 )

        // Assert
        expect( findUserProjectProfiles ).toHaveBeenCalledWith( 0, 10, expect.anything() )
    } )

    it( 'keeps the invitations search untouched when nothing changed', () => {
        // Arrange
        facade.inputInvitationsPageSearchParameters( 'wolves', undefined )
        facade.fetchProjectProfileInvitationPage( 0, 10 )

        // Act
        facade.inputInvitationsPageSearchParameters( 'wolves', undefined )

        // Assert
        expect( facade.userProjectProfileInvitationsPageResetSearch() ).toBe( false )
        expect( facade.userProjectProfileInvitationsPageTextSearchParam() ).toBe( 'wolves' )
    } )
} )

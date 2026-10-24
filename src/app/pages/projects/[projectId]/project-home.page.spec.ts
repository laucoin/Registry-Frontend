import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProjectHomePage } from './project-home.page'

const PROJECT_ID: string = 'p1'

function userWith( ...authorities: string[] ): CurrentUserModel {
    return { authorities } as unknown as CurrentUserModel
}

describe( 'ProjectHomePage', () => {
    let currentUser: WritableSignal<CurrentUserModel | undefined>
    let projectId: WritableSignal<string | undefined>
    let page: ProjectHomePage

    beforeEach( () => {
        currentUser = signal<CurrentUserModel | undefined>( undefined )
        projectId = signal<string | undefined>( PROJECT_ID )
        TestBed.configureTestingModule( {
            providers: [
                {
                    provide: SessionFacade,
                    useValue: {
                        selectedProject: signal( undefined ),
                        selectedProjectHasOption: (): WritableSignal<boolean> => signal( true ),
                        currentUser,
                        currentProjectId: projectId,
                    },
                },
                { provide: UiFacade, useValue: { tinyScreen: signal( false ) } },
            ],
        } )
        page = TestBed.runInInjectionContext( (): ProjectHomePage => new ProjectHomePage() )
    } )

    it( 'lets who can create movements see the arrivals and the departures of the day', () => {
        // Arrange
        currentUser.set( userWith( `${ PROJECT_ID }_REGISTRY_PROJECT_MOVEMENT_C` ) )

        // Act
        const allowed: boolean = page[ 'canSeePlannedMovements' ]()

        // Assert
        expect( allowed ).toBe( true )
    } )

    it( 'hides the arrivals and the departures from who cannot create movements', () => {
        // Arrange
        currentUser.set( userWith( `${ PROJECT_ID }_REGISTRY_PROJECT_MOVEMENT_R` ) )

        // Act
        const allowed: boolean = page[ 'canSeePlannedMovements' ]()

        // Assert
        expect( allowed ).toBe( false )
    } )

    it( 'lets who can create alerts open the alert creation', () => {
        // Arrange
        currentUser.set( userWith( `${ PROJECT_ID }_REGISTRY_PROJECT_ALERT_C` ) )

        // Act
        const allowed: boolean = page[ 'canCreateAlert' ]()

        // Assert
        expect( allowed ).toBe( true )
    } )

    it( 'hides the alert creation from who cannot create alerts', () => {
        // Arrange
        currentUser.set( userWith( `${ PROJECT_ID }_REGISTRY_PROJECT_ALERT_R` ) )

        // Act
        const allowed: boolean = page[ 'canCreateAlert' ]()

        // Assert
        expect( allowed ).toBe( false )
    } )

    it( 'targets the movement creation of the selected project', () => {
        // Arrange

        // Act
        const route: string = page[ 'registeredMovementRoute' ]()

        // Assert
        expect( route ).toBe( `/projects/${ PROJECT_ID }/movements/create/registered` )
    } )

    it( 'does not take the right of another project into account', () => {
        // Arrange
        currentUser.set( userWith( 'other_REGISTRY_PROJECT_MOVEMENT_C' ) )

        // Act
        const allowed: boolean = page[ 'canSeePlannedMovements' ]()

        // Assert
        expect( allowed ).toBe( false )
    } )

    it( 'hides them while the user or the project is not known', () => {
        // Arrange
        projectId.set( undefined )

        // Act
        const withoutProject: boolean = page[ 'canSeePlannedMovements' ]()
        currentUser.set( undefined )
        projectId.set( PROJECT_ID )
        const withoutUser: boolean = page[ 'canSeePlannedMovements' ]()

        // Assert
        expect( [ withoutProject, withoutUser ] ).toEqual( [ false, false ] )
    } )
} )

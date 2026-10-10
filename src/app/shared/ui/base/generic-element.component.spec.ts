import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { ConfirmationModel } from '@shared/models/model/confirmation.model'
import { Observable, Subject } from 'rxjs'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { GenericElementComponent } from '@shared/ui/base/generic-element.component'

class TestElement extends GenericElementComponent {
    public get isBusy (): boolean {
        return this.busy()
    }

    public execute (command: Observable<unknown>): void {
        this.run( command )
    }

    public allowedOnProject (authority: ProjectAuthorityEnum, projectId?: string): boolean {
        return projectId ? this.hasProjectAuthority( authority, projectId ) : this.hasProjectAuthority( authority )
    }

    public allowed (authority: UserAuthorityEnum): boolean {
        return this.hasAuthority( authority )
    }

    public enabled (action: ElementActionEnum): boolean {
        return this.actionIsEnable( action )
    }

    public optionAvailable (option: ProjectOptionEnum): boolean {
        return this.projectHasOption( option )
    }

    public confirmation (accept: () => void): ConfirmationModel {
        return this.buildConfirmation( 'groups.confirm', 'pi pi-info', { name: 'Wolves' }, SeverityEnum.DANGER, accept )
    }

    public confirmLater (accept: () => void): () => void {
        return this.confirmThen( 'groups.confirm', 'pi pi-info', { name: 'Wolves' }, SeverityEnum.WARNING, accept )
    }
}

describe( 'GenericElementComponent', () => {
    let confirm: Mock<(confirmation: ConfirmationModel) => void>
    let element: TestElement

    beforeEach( () => {
        confirm = vi.fn()
        RegistryConfig.config = { enabledActions: [ firstAction() ] } as unknown as ConfigModel
        TestBed.configureTestingModule( {
            providers: [
                {
                    provide: SessionFacade,
                    useValue: {
                        currentUser: signal( { id: 'u1', authorities: [ 'p1_REGISTRY_PROJECT_R', 'REGISTRY_USER_R' ] } as CurrentUserModel ),
                        selectedProject: signal( { id: 'p1', options: [ { label: 'Alerts', value: ProjectOptionEnum.ALERT } ] } as unknown as ProjectModel ),
                    },
                },
                { provide: UiFacade, useValue: Object.assign( autoMock(), { confirm } ) },
                { provide: Router, useValue: {} },
                { provide: ActivatedRoute, useValue: {} },
                { provide: TranslocoService, useValue: { translate: (key: string, params?: object): string => `${key}${params ? JSON.stringify( params ) : ''}` } },
            ],
        } )
        element = TestBed.runInInjectionContext( (): TestElement => new TestElement() )
    } )

    it( 'is busy only while a command is running', () => {
        // Arrange
        const command: Subject<string> = new Subject<string>()
        element.execute( command )
        const whileRunning: boolean = element.isBusy

        // Act
        command.complete()

        // Assert
        expect( whileRunning ).toBe( true )
        expect( element.isBusy ).toBe( false )
    } )

    it( 'checks the project authority on the selected project by default and on a given project otherwise', () => {
        // Arrange
        const authority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_R

        // Act
        const results: boolean[] = [ element.allowedOnProject( authority ), element.allowedOnProject( authority, 'p2' ) ]

        // Assert
        expect( results ).toEqual( [ true, false ] )
    } )

    it( 'checks the user authority', () => {
        // Arrange
        const results: boolean[] = []

        // Act
        results.push( element.allowed( UserAuthorityEnum.REGISTRY_USER_R ), element.allowed( UserAuthorityEnum.REGISTRY_USER_D ) )

        // Assert
        expect( results ).toEqual( [ true, false ] )
    } )

    it( 'only enables the actions listed in the configuration', () => {
        // Arrange
        const enabled: ElementActionEnum = firstAction()
        const other: ElementActionEnum = Object.values( ElementActionEnum ).find( (value: ElementActionEnum): boolean => value !== enabled )!

        // Act
        const results: boolean[] = [ element.enabled( enabled ), element.enabled( other ) ]

        // Assert
        expect( results ).toEqual( [ true, false ] )
    } )

    it( 'tells whether the selected project has an option', () => {
        // Arrange
        const results: boolean[] = []

        // Act
        results.push( element.optionAvailable( ProjectOptionEnum.ALERT ), element.optionAvailable( ProjectOptionEnum.VEHICLE ) )

        // Assert
        expect( results ).toEqual( [ true, false ] )
    } )

    it( 'builds a confirmation with translated texts, the severity of the accept button', () => {
        // Arrange
        const accept: () => void = vi.fn()

        // Act
        const confirmation: ConfirmationModel = element.confirmation( accept )

        // Assert
        expect( confirmation.header ).toBe( 'groups.confirm.title{"element":{"name":"Wolves"}}' )
        expect( confirmation.message ).toBe( 'groups.confirm.message{"element":{"name":"Wolves"}}' )
        expect( confirmation.acceptSeverity ).toBe( SeverityEnum.DANGER )
        expect( confirmation.accept ).toBe( accept )
    } )

    it( 'asks for the confirmation only when the returned command runs', () => {
        // Arrange
        const accept: () => void = vi.fn()
        const command: () => void = element.confirmLater( accept )
        const askedBefore: number = confirm.mock.calls.length

        // Act
        command()
        confirm.mock.calls[ 0 ][ 0 ].accept!()

        // Assert
        expect( askedBefore ).toBe( 0 )
        expect( confirm ).toHaveBeenCalledTimes( 1 )
        expect( accept ).toHaveBeenCalledTimes( 1 )
    } )
} )

function firstAction (): ElementActionEnum {
    return Object.values( ElementActionEnum )[ 0 ]
}

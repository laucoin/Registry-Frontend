import { Component, signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { SessionFacade } from '@core/registry/state/session.facade'
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { beforeEach, describe, expect, it } from 'vitest'

@Component( {
    selector: 'app-authority-host',
    imports: [ IfProjectAuthorityDirective ],
    template: '<p *appIfProjectAuthority="authority">content</p>',
} )
class AuthorityHost {
    public readonly authority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_D
}

describe( 'IfProjectAuthorityDirective', () => {
    const currentUser: WritableSignal<{ authorities: string[] } | undefined> = signal( undefined )

    beforeEach( () => {
        currentUser.set( undefined )
        TestBed.configureTestingModule( {
            providers: [ { provide: SessionFacade, useValue: { currentUser, selectedProject: (): { id: string } => ({ id: 'p1' }) } } ],
        } )
    } )

    function render (): HTMLElement {
        const fixture: ReturnType<typeof TestBed.createComponent<AuthorityHost>> = TestBed.createComponent( AuthorityHost )
        fixture.detectChanges()
        return fixture.nativeElement as HTMLElement
    }

    it( 'renders its host when the authority is held on the selected project', () => {
        // Arrange
        currentUser.set( { authorities: [ 'p1_REGISTRY_PROJECT_GROUP_D' ] } )

        // Act
        const element: HTMLElement = render()

        // Assert
        expect( element.querySelector( 'p' ) ).not.toBeNull()
    } )

    it( 'hides its host when the authority is missing or held on another project', () => {
        // Arrange
        currentUser.set( { authorities: [ 'p1_REGISTRY_PROJECT_GROUP_U', 'p2_REGISTRY_PROJECT_GROUP_D' ] } )

        // Act
        const element: HTMLElement = render()

        // Assert
        expect( element.querySelector( 'p' ) ).toBeNull()
    } )
} )

import { Component, Signal, TemplateRef, viewChild } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'

@Component( {
    selector: 'app-template-host',
    imports: [ RegistryTemplateDirective ],
    template: '<ng-template appTemplate="header"><p>content</p></ng-template>',
} )
class TemplateHost {
    public readonly directive: Signal<RegistryTemplateDirective> = viewChild.required( RegistryTemplateDirective )
}

describe( 'directives', () => {
    beforeEach( () => {
        TestBed.configureTestingModule( { providers: [ { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } } ] } )
    } )

    it( 'exposes the template under the given name', () => {
        // Arrange
        const fixture: ReturnType<typeof TestBed.createComponent<TemplateHost>> = TestBed.createComponent( TemplateHost )

        // Act
        fixture.detectChanges()
        const directive: RegistryTemplateDirective = fixture.componentInstance.directive()

        // Assert
        expect( directive.appTemplate() ).toBe( 'header' )
        expect( directive.template ).toBeInstanceOf( TemplateRef )
    } )
} )

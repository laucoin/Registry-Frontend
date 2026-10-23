import { Component, Signal, TemplateRef, viewChild } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'
import { RegistryRequiredDirective } from '@shared/directives/registry-required.directive'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'

@Component( {
    selector: 'app-required-host',
    imports: [ RegistryRequiredDirective ],
    template: '<span appRequired>Name</span>',
} )
class RequiredHost {}

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

    it( 'appends a translated and discreet required mark to the host', () => {
        // Arrange
        const fixture: ReturnType<typeof TestBed.createComponent<RequiredHost>> = TestBed.createComponent( RequiredHost )

        // Act
        fixture.detectChanges()
        const span: HTMLSpanElement = fixture.nativeElement.querySelector( 'span span' )

        // Assert
        expect( span.innerHTML ).toBe( ' - t:global.form.required' )
        expect( span.style.fontSize ).toBe( '12px' )
        expect( span.style.color ).toBe( 'var(--text-color-secondary)' )
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

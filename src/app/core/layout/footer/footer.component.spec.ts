import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { RegistryConfig } from '@core/config/registry.config'
import { FooterComponent } from '@core/layout/footer/footer.component'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'

describe( 'FooterComponent', () => {
    function create (issuesUrl: string | null): HTMLElement {
        RegistryConfig.config = {
            application: {
                name: 'Registry',
                organization: 'Org',
                creator: { name: 'Creator', email: 'creator@example.org', website: 'https://example.org' },
                support: { issuesUrl },
            },
        } as typeof RegistryConfig.config
        TestBed.configureTestingModule( {
            imports: [ TranslocoTestingModule.forRoot( { langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } } ) ],
            providers: [ provideRouter( [] ) ],
        } )
        const fixture: ComponentFixture<FooterComponent> = TestBed.createComponent( FooterComponent )
        fixture.detectChanges()
        return fixture.nativeElement as HTMLElement
    }

    beforeEach( () => {
        TestBed.resetTestingModule()
    } )

    it( 'links the privacy policy and the terms to their internal routes', () => {
        // Arrange
        const footer: HTMLElement = create( null )

        // Act
        const hrefs: (string | null)[] = Array.from( footer.querySelectorAll( 'a[href^="/"]' ) ).map( (it: Element): string | null => it.getAttribute( 'href' ) )

        // Assert
        expect( hrefs ).toEqual( [ '/privacy', '/terms' ] )
    } )

    it( 'opens the support link in a new tab', () => {
        // Arrange
        const footer: HTMLElement = create( 'https://example.org/issues' )

        // Act
        const support: Element | null = footer.querySelector( 'a[href="https://example.org/issues"]' )

        // Assert
        expect( support?.getAttribute( 'target' ) ).toBe( '_blank' )
        expect( support?.getAttribute( 'rel' ) ).toBe( 'noopener noreferrer' )
    } )

    it( 'hides the support link when no support url is configured', () => {
        // Arrange
        const footer: HTMLElement = create( null )

        // Act
        const external: NodeListOf<Element> = footer.querySelectorAll( 'a[target="_blank"]' )

        // Assert
        expect( external.length ).toBe( 1 )
    } )
} )

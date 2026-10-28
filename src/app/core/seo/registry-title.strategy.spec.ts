import { TestBed } from '@angular/core/testing'
import { Meta, Title } from '@angular/platform-browser'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { BehaviorSubject, map, Observable, throwError } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { RegistryTitleStrategy } from '@core/seo/registry-title.strategy'
import { SEO_DATA_KEY } from '@core/seo/route-seo.model'

const TEXTS: Record<string, Record<string, string>> = {
    fr: { 'seo.login.title': 'Connexion', 'seo.login.description': 'Connecte-toi', 'seo.users.list': 'Utilisateurs' },
    en: { 'seo.login.title': 'Sign in', 'seo.login.description': 'Sign in now', 'seo.users.list': 'Users' },
}

function snapshotOf (url: string, data: Record<string, unknown>): RouterStateSnapshot {
    const leaf: ActivatedRouteSnapshot = { data, firstChild: null } as unknown as ActivatedRouteSnapshot
    const root: ActivatedRouteSnapshot = { data: {}, firstChild: leaf } as unknown as ActivatedRouteSnapshot
    return { url, root } as RouterStateSnapshot
}

describe( 'RegistryTitleStrategy', () => {
    let strategy: RegistryTitleStrategy
    let title: Title
    let meta: Meta
    let language: BehaviorSubject<string>
    let setCanonicalLink: Mock
    let selectTranslate: Mock

    function provide (translate: (key: string) => Observable<string>): void {
        selectTranslate = vi.fn( translate )
        TestBed.configureTestingModule( {
            providers: [
                { provide: TranslocoService, useValue: { selectTranslate, getActiveLang: (): string => language.value } },
                { provide: BrowserService, useValue: { origin: 'https://registry.test', setCanonicalLink } },
            ],
        } )
        strategy = TestBed.inject( RegistryTitleStrategy )
        title = TestBed.inject( Title )
        meta = TestBed.inject( Meta )
    }

    function publish (url: string, titleKey: string | undefined, data: Record<string, unknown> = {}): void {
        vi.spyOn( strategy as unknown as { buildTitle: () => string | undefined }, 'buildTitle' ).mockReturnValue( titleKey )
        strategy.updateTitle( snapshotOf( url, data ) )
    }

    beforeEach( () => {
        language = new BehaviorSubject<string>( 'fr' )
        setCanonicalLink = vi.fn()
        provide( (key: string): Observable<string> => language.pipe( map( (lang: string): string => TEXTS[ lang ][ key ] ) ) )
    } )

    it( 'titles a private route and marks it noindex', () => {
        // Arrange

        // Act
        publish( '/users', 'seo.users.list' )

        // Assert
        expect( title.getTitle() ).toBe( 'Utilisateurs · Registry' )
        expect( meta.getTag( 'name="robots"' )?.content ).toBe( 'noindex, nofollow' )
        expect( meta.getTag( 'name="description"' ) ).toBeNull()
        expect( setCanonicalLink ).toHaveBeenLastCalledWith( undefined )
    } )

    it( 'publishes the description, sharing tags and canonical url of a public route', () => {
        // Arrange
        const data: Record<string, unknown> = { [ SEO_DATA_KEY ]: { descriptionKey: 'seo.login.description' } }

        // Act
        publish( '/login?redirect=%2Fusers#top', 'seo.login.title', data )

        // Assert
        expect( title.getTitle() ).toBe( 'Connexion · Registry' )
        expect( meta.getTag( 'name="robots"' )?.content ).toBe( 'index, follow' )
        expect( meta.getTag( 'name="description"' )?.content ).toBe( 'Connecte-toi' )
        expect( meta.getTag( 'property="og:title"' )?.content ).toBe( 'Connexion' )
        expect( meta.getTag( 'property="og:url"' )?.content ).toBe( 'https://registry.test/login' )
        expect( meta.getTag( 'property="og:locale"' )?.content ).toBe( 'fr' )
        expect( setCanonicalLink ).toHaveBeenLastCalledWith( 'https://registry.test/login' )
    } )

    it( 'publishes the sharing image of a public route with an absolute url', () => {
        // Arrange
        const data: Record<string, unknown> = { [ SEO_DATA_KEY ]: { descriptionKey: 'seo.login.description' } }

        // Act
        publish( '/login', 'seo.login.title', data )

        // Assert
        expect( meta.getTag( 'property="og:image"' )?.content ).toBe( 'https://registry.test/img/login-hero.webp' )
        expect( meta.getTag( 'name="twitter:image"' )?.content ).toBe( 'https://registry.test/img/login-hero.webp' )
        expect( meta.getTag( 'name="twitter:card"' )?.content ).toBe( 'summary_large_image' )
        expect( meta.getTag( 'property="og:image:width"' )?.content ).toBe( '1440' )
        expect( meta.getTag( 'property="og:image:height"' )?.content ).toBe( '1080' )
    } )

    it( 'removes the public tags when navigating to a private route', () => {
        // Arrange
        publish( '/login', 'seo.login.title', { [ SEO_DATA_KEY ]: { descriptionKey: 'seo.login.description' } } )

        // Act
        publish( '/users', 'seo.users.list' )

        // Assert
        expect( meta.getTag( 'name="description"' ) ).toBeNull()
        expect( meta.getTag( 'property="og:title"' ) ).toBeNull()
        expect( meta.getTag( 'property="og:image"' ) ).toBeNull()
        expect( meta.getTag( 'name="twitter:image"' ) ).toBeNull()
        expect( meta.getTag( 'name="robots"' )?.content ).toBe( 'noindex, nofollow' )
    } )

    it( 'translates the title again when the language changes', () => {
        // Arrange
        publish( '/users', 'seo.users.list' )

        // Act
        language.next( 'en' )

        // Assert
        expect( title.getTitle() ).toBe( 'Users · Registry' )
    } )

    it( 'keeps the current title when the route has none', () => {
        // Arrange
        title.setTitle( 'Initial' )

        // Act
        publish( '/', undefined )

        // Assert
        expect( title.getTitle() ).toBe( 'Initial' )
    } )

    it( 'keeps the current title when the translation fails', () => {
        // Arrange
        TestBed.resetTestingModule()
        provide( (): Observable<string> => throwError( (): Error => new Error( 'load failed' ) ) )
        title.setTitle( 'Initial' )

        // Act
        publish( '/users', 'seo.users.list' )

        // Assert
        expect( title.getTitle() ).toBe( 'Initial' )
    } )
} )

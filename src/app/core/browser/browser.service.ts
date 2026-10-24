import { Injectable } from '@angular/core'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

const THEME_ATTRIBUTE: string = 'data-theme'
const HIGHLIGHT_CLASS: string = 'highlight'
const HIGHLIGHT_DURATION_MS: number = 1000
export const PREFERENCE_COOKIE_MAX_AGE_SECONDS: number = 60 * 60 * 24 * 365

/**
 * Purpose: Single access point to the browser globals the application depends on.
 * Scope: Wraps location, viewport, scroll, page visibility, element intersection, color scheme, cookies, root element attributes, the canonical link and element lookup.
 * Limits: Holds no state and applies no application logic; it does not manage storage (see the storage helpers).
 */
@Injectable( { providedIn: 'root' } )
export class BrowserService {
    private colorSchemeQuery: MediaQueryList | undefined

    public get pathname (): string {
        return location.pathname
    }

    public get relativeUrl (): string {
        return `${location.pathname}${location.search}${location.hash}`
    }

    public get origin (): string {
        return location.origin
    }

    public get host (): string {
        return location.host
    }

    public get online (): boolean {
        return navigator.onLine
    }

    public get viewportWidth (): number {
        return window.innerWidth
    }

    public get pageVisible (): boolean {
        return document.visibilityState !== 'hidden'
    }

    public get preferredLanguages (): readonly string[] {
        return navigator.languages
    }

    public get systemTheme (): ThemeEnum {
        return this.lightSchemeQuery?.matches === false ? ThemeEnum.DARK : ThemeEnum.LIGHT
    }

    public onViewportResize (listener: (width: number) => void): () => void {
        const onResize: () => void = (): void => listener( window.innerWidth )
        window.addEventListener( 'resize', onResize )
        return (): void => window.removeEventListener( 'resize', onResize )
    }

    public onVisibilityChange (listener: (visible: boolean) => void): () => void {
        const onChange: () => void = (): void => listener( this.pageVisible )
        document.addEventListener( 'visibilitychange', onChange )
        return (): void => document.removeEventListener( 'visibilitychange', onChange )
    }

    public observeIntersection (element: Element, listener: (visible: boolean) => void): () => void {
        if (typeof IntersectionObserver !== 'function') {
            listener( true )
            return (): void => undefined
        }
        const observer: IntersectionObserver = new IntersectionObserver(
            (entries: IntersectionObserverEntry[]): void => listener( entries[ entries.length - 1 ].isIntersecting ),
        )
        observer.observe( element )
        return (): void => observer.disconnect()
    }

    public redirect (url: string): void {
        window.location.href = url
    }

    public downloadJson (content: unknown, filename: string): void {
        const url: string = URL.createObjectURL( new Blob( [ JSON.stringify( content, null, 2 ) ], { type: 'application/json' } ) )
        const link: HTMLAnchorElement = document.createElement( 'a' )
        link.href = url
        link.download = filename
        link.click()
        setTimeout( (): void => URL.revokeObjectURL( url ) )
    }

    public reload (): void {
        location.reload()
    }

    public setRootTheme (theme: ThemeEnum): void {
        if (theme === ThemeEnum.SYSTEM) {
            document.documentElement.removeAttribute( THEME_ATTRIBUTE )
        } else {
            document.documentElement.setAttribute( THEME_ATTRIBUTE, theme )
        }
    }

    public setCanonicalLink (url: string | undefined): void {
        document.head.querySelector( 'link[rel="canonical"]' )?.remove()
        if (url === undefined) return
        const link: HTMLLinkElement = document.createElement( 'link' )
        link.rel = 'canonical'
        link.href = url
        document.head.appendChild( link )
    }

    public readCookie (name: string): string | undefined {
        const prefix: string = `${ name }=`
        const entry: string | undefined = document.cookie.split( '; ' ).find( (it: string): boolean => it.startsWith( prefix ) )
        return entry ? decodeURIComponent( entry.substring( prefix.length ) ) : undefined
    }

    public writeCookie (name: string, value: string, maxAgeSeconds: number): void {
        const secure: string = location.protocol === 'https:' ? '; Secure' : ''
        document.cookie = `${ name }=${ encodeURIComponent( value ) }; Path=/; Max-Age=${ maxAgeSeconds }; SameSite=Lax${ secure }`
    }

    public setRootLanguage (language: string): void {
        document.documentElement.lang = language
    }

    public highlightByDataValue (value: string, root: ParentNode = document): void {
        const element: HTMLElement | null = root.querySelector( `[data-value="${ CSS.escape( value ) }"]` )
        if (element) {
            element.classList.add( HIGHLIGHT_CLASS )
            setTimeout( (): void => element.classList.remove( HIGHLIGHT_CLASS ), HIGHLIGHT_DURATION_MS )
        }
    }

    private get lightSchemeQuery (): MediaQueryList | undefined {
        if (typeof window.matchMedia !== 'function') {
            return undefined
        }
        return this.colorSchemeQuery ??= window.matchMedia( '(prefers-color-scheme: light)' )
    }
}

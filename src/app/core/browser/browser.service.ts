import { Injectable } from '@angular/core'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

const THEME_ATTRIBUTE: string = 'data-theme'
const HIGHLIGHT_CLASS: string = 'highlight'
const HIGHLIGHT_DURATION_MS: number = 1000

/**
 * Purpose: Single access point to the browser globals the application depends on.
 * Scope: Wraps location, viewport, scroll, color scheme, root element attributes and element lookup.
 * Limits: Holds no state and applies no application logic; it does not manage storage (see the storage helpers).
 */
@Injectable( { providedIn: 'root' } )
export class BrowserService {
    private colorSchemeQuery: MediaQueryList | undefined

    public get pathname (): string {
        return location.pathname
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

    public get scrollOffset (): number {
        return window.pageYOffset || document.documentElement.scrollTop
    }

    public get preferredLanguages (): readonly string[] {
        return navigator.languages
    }

    public get systemTheme (): ThemeEnum {
        return this.lightSchemeQuery?.matches === false ? ThemeEnum.DARK : ThemeEnum.LIGHT
    }

    public onSystemThemeChange (listener: () => void): void {
        this.lightSchemeQuery?.addEventListener( 'change', listener )
    }

    public redirect (url: string): void {
        window.location.href = url
    }

    public setRootTheme (theme: ThemeEnum): void {
        if (theme === ThemeEnum.SYSTEM) {
            document.documentElement.removeAttribute( THEME_ATTRIBUTE )
        } else {
            document.documentElement.setAttribute( THEME_ATTRIBUTE, theme )
        }
    }

    public setRootLanguage (language: string): void {
        document.documentElement.lang = language
    }

    public highlightByDataValue (value: string): void {
        const element: HTMLElement | null = document.querySelector( `[data-value="${ value }"]` )
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

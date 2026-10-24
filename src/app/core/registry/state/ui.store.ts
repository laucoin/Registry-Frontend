import { inject } from '@angular/core'
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum'
import { BrowserService, PREFERENCE_COOKIE_MAX_AGE_SECONDS } from '@core/browser/browser.service'
import { ErrorModel } from '@shared/models/model/error.model'

const THEME_COOKIE: string = 'registry-theme'

function storedTheme(browser: BrowserService): ThemeEnum | undefined {
    const stored: string | undefined = browser.readCookie( THEME_COOKIE )
    return Object.values( ThemeEnum ).find( (it: ThemeEnum): boolean => it === stored )
}

interface UiStoreModel {
    theme: ThemeEnum
    refreshMode: RefreshModeEnum
    screenWidth: number
    online: boolean | undefined
    pendingLanguage: string | undefined
    error: NotificationModel | undefined
}

/**
 * Purpose: Holds the shell display state: theme, refresh mode, screen width, network, language change in flight and error.
 * Scope: Owns that state, remembers the theme in a cookie for the next visit, follows the viewport width and applies the theme on the document through the browser service.
 * Limits: Knows nothing about the user or the session and does not call the backend.
 */
export const UiStore = signalStore(
    { providedIn: 'root' },
    withState<UiStoreModel>( () => {
        const browser: BrowserService = inject( BrowserService )
        return {
            theme: storedTheme( browser ) ?? browser.systemTheme,
            refreshMode: RefreshModeEnum.NORMAL,
            screenWidth: browser.viewportWidth,
            online: undefined,
            pendingLanguage: undefined,
            error: undefined,
        }
    } ),
    withMethods( (store, browser: BrowserService = inject( BrowserService )) => ({
        setGlobalError: (error: ErrorModel): void => {
            if (store.error()) return
            patchState( store, {
                error: {
                    severity: 'error',
                    summary: error.title,
                    detail: error.message,
                    closable: true,
                },
            } )
        },
        startLanguageChange: (language: string): void => patchState( store, { pendingLanguage: language } ),
        stopLanguageChange: (): void => patchState( store, { pendingLanguage: undefined } ),
        updateRefreshMode: (refreshMode: RefreshModeEnum): void => patchState( store, { refreshMode: refreshMode } ),
        updateNetwork: (online: boolean): void => patchState( store, { online: online } ),
        updateTheme: (theme: ThemeEnum): void => {
            browser.setRootTheme( theme )
            browser.writeCookie( THEME_COOKIE, theme, PREFERENCE_COOKIE_MAX_AGE_SECONDS )
            patchState( store, { theme: theme } )
        },
    }) ),
    withHooks( (store, browser: BrowserService = inject( BrowserService )) => {
        let stopFollowingViewport: (() => void) | undefined
        return {
            onInit: (): void => {
                const remembered: ThemeEnum | undefined = storedTheme( browser )
                if (remembered) {
                    browser.setRootTheme( remembered )
                }
                stopFollowingViewport = browser.onViewportResize( (width: number): void => patchState( store, { screenWidth: width } ) )
            },
            onDestroy: (): void => stopFollowingViewport?.(),
        }
    } ),
)

import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { BrowserService } from '@core/browser/browser.service'
import { ErrorModel } from '@shared/models/model/error.model'

interface UiStoreModel {
    theme: ThemeEnum
    screenWidth: number
    online: boolean | undefined
    pendingLanguage: string | undefined
    loading: boolean
    error: NotificationModel | undefined
}

/**
 * Purpose: Holds the shell display state: theme, screen width, network, language change in flight, global loader and error.
 * Scope: Owns that state and applies the theme on the document through the browser service.
 * Limits: Knows nothing about the user or the session and does not call the backend.
 */
export const UiStore = signalStore(
    { providedIn: 'root' },
    withState<UiStoreModel>( () => {
        const browser: BrowserService = inject( BrowserService )
        return {
            theme: browser.systemTheme,
            screenWidth: browser.viewportWidth,
            online: undefined,
            pendingLanguage: undefined,
            loading: false,
            error: undefined,
        }
    } ),
    withMethods( (store, browser: BrowserService = inject( BrowserService )) => ({
        startGlobalLoader: (): void => patchState( store, { loading: true } ),
        stopGlobalLoader: (): void => patchState( store, { loading: false } ),
        setGlobalError: (error: ErrorModel): void => patchState( store, {
            error: {
                severity: 'error',
                summary: error.title,
                detail: error.message,
                icon: 'pi pi-exclamation-triangle',
                closable: true,
            },
        } ),
        startLanguageChange: (language: string): void => patchState( store, { pendingLanguage: language } ),
        stopLanguageChange: (): void => patchState( store, { pendingLanguage: undefined } ),
        updateNetwork: (online: boolean): void => patchState( store, { online: online } ),
        updateScreenWidth: (screenWidth: number): void => patchState( store, { screenWidth: screenWidth } ),
        updateTheme: (theme: ThemeEnum): void => {
            browser.setRootTheme( theme )
            patchState( store, { theme: theme } )
        },
    }) ),
)

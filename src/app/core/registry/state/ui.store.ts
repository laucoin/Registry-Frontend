import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { ToastMessageOptions } from 'primeng/api'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { BrowserService } from '@core/browser/browser.service'
import { ErrorModel } from '@shared/models/model/error.model'

interface UiStoreModel {
    theme: ThemeEnum
    screenWidth: number
    language: string | undefined
    online: boolean | undefined
    loading: boolean
    error: ToastMessageOptions | undefined
}

const darkModeClass: string = 'dark-mod'

export const UiStore = signalStore(
    { providedIn: 'root' },
    withState<UiStoreModel>( () => {
        const browser: BrowserService = inject( BrowserService )
        return {
            theme: browser.systemTheme,
            screenWidth: browser.viewportWidth,
            language: undefined,
            online: undefined,
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
        updateNetwork: (online: boolean): void => patchState( store, { online: online } ),
        updateScreenWidth: (screenWidth: number): void => patchState( store, { screenWidth: screenWidth } ),
        updateLanguage: (language: string): void => {
            browser.setRootLanguage( language )
            patchState( store, { language: language } )
        },
        updateTheme: (theme: ThemeEnum): void => {
            const dark: boolean = theme === ThemeEnum.DARK || (theme !== ThemeEnum.LIGHT && browser.systemTheme === ThemeEnum.DARK)
            browser.setRootClass( darkModeClass, dark )
            patchState( store, { theme: theme } )
        },
    }) ),
)

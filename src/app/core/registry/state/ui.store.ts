import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { ToastMessageOptions } from 'primeng/api'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ErrorModel } from '@shared/models/model/error.model'

interface UiStoreModel {
    theme: ThemeEnum
    screenWidth: number
    online: boolean | undefined
    loading: boolean
    error: ToastMessageOptions | undefined
}

const darkModeClass: string = 'dark-mod'

export const UiStore = signalStore(
    { providedIn: 'root' },
    withState<UiStoreModel>( {
        theme: (!window.matchMedia || window.matchMedia( '(prefers-color-scheme: light)' ).matches) ? ThemeEnum.LIGHT : ThemeEnum.DARK,
        screenWidth: window.innerWidth,
        online: undefined,
        loading: false,
        error: undefined,
    } ),
    withMethods( (store) => ({
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
        updateTheme: (theme: ThemeEnum): void => {
            const html: HTMLHtmlElement | null = document.querySelector( 'html' )
            const dark: boolean = theme === ThemeEnum.DARK || (theme !== ThemeEnum.LIGHT && GenericHelper.navigatorTheme === ThemeEnum.DARK)
            if (dark) {
                html?.classList.add( darkModeClass )
            } else {
                html?.classList.remove( darkModeClass )
            }
            patchState( store, { theme: theme } )
        },
    }) ),
)

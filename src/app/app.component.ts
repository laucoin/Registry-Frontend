import { Component, OnDestroy, OnInit, Signal, signal, WritableSignal } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ConfirmationService, MessageService, ToastMessageOptions, Translation } from 'primeng/api'
import { BlockUIModule } from 'primeng/blockui'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { ToastModule } from 'primeng/toast'
import { fromEvent, map, merge, of, Subscription } from 'rxjs'
import { AppConfig } from './app.config'
import { RegistryFacade } from './shared/util-common/state/registry.facade'
import { MessageComponent } from './shared/util-ui/message/message.component'
import { SideBarComponent } from './shell/side-bar/side-bar.component'
import { breakPoint } from './shared/util-tool/util/breakpoint.const'
import { GenericUtil } from './shared/util-tool/util/generic.util'
import { PrimeNG } from 'primeng/config'
import { Button } from 'primeng/button'
import { Dialog } from 'primeng/dialog'
import { Divider } from 'primeng/divider'

@Component( {
    selector: 'app-root',
    standalone: true,
    imports: [
        TranslateModule,
        ConfirmDialogModule,
        SideBarComponent,
        ToastModule,
        RouterOutlet,
        BlockUIModule,
        ProgressSpinnerModule,
        MessageComponent,
        Button,
        Dialog,
        Divider,
    ],
    providers: [ ConfirmationService, MessageService ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
} )
export class AppComponent implements OnInit, OnDestroy {
    protected readonly GenericUtil: typeof GenericUtil = GenericUtil
    protected readonly breakPoint: object = breakPoint
    private readonly subscriptions: Subscription = new Subscription()
    private readonly themeMediaQuery: MediaQueryList = window.matchMedia( '(prefers-color-scheme: light)' )

    protected readonly loading: WritableSignal<boolean> = signal( false )
    protected readonly error: WritableSignal<ToastMessageOptions | undefined> = signal( undefined )

    protected readonly currentYear: Signal<number> = signal( new Date().getFullYear() )
    protected readonly currentUrl: Signal<string> = signal( location.host )

    protected showInformationDialog: boolean = false
    protected showTermsOfUserDialog: boolean = false

    public constructor (
        private readonly translateService: TranslateService,
        private readonly primeConfig: PrimeNG,
        private readonly notifyService: MessageService,
        private readonly registryFacade: RegistryFacade,
    ) {
        this.registryFacade.restoreTokensFromSessionStorage()
        this.handleLoadingAndError()
    }

    public ngOnInit (): void {
        this.registryFacade.fetchCurrentUser()

        this.initTheme()
        this.listenThemeChange()

        this.initTranslation()

        this.handleNetwork()

        this.handleNotification()
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    private handleLoadingAndError (): void {
        this.subscriptions.add(
            this.registryFacade.globalLoading.subscribe( (loading: boolean): void => {
                this.loading.set( loading )
            } ),
        )
        this.subscriptions.add(
            this.registryFacade.globalError.subscribe( (error: ToastMessageOptions | undefined): void => {
                this.error.set( error )
            } ),
        )
    }

    protected logout (): void {
        this.registryFacade.logout()
    }

    private initTheme (): void {
        this.registryFacade.updateTheme( !window.matchMedia || this.themeMediaQuery.matches ? 'light' : 'dark' )
    }

    private listenThemeChange (): void {
        this.themeMediaQuery.addEventListener(
            'change',
            (e: MediaQueryListEvent): void => this.registryFacade.updateTheme( e.matches ? 'light' : 'dark' ),
        )
    }

    private initTranslation (): void {
        this.translateService.addLangs( AppConfig.config.languages )

        let nextLang: string | undefined

        navigator.languages.forEach( (lang: string): void => {
            if (this.translateService.langs.includes( lang ) && !nextLang) {
                nextLang = lang
            }
        } )

        this.translateService.setDefaultLang( nextLang || AppConfig.config.defaultLanguage )
        this.translateService
            .get( 'primeng' )
            .subscribe( (it: Translation) => this.primeConfig.setTranslation( it ) )
    }

    private handleNetwork (): void {
        this.subscriptions.add( merge( fromEvent( window, 'online' )
            .pipe( map( (): boolean => true ) ), fromEvent( window, 'offline' )
            .pipe( map( (): boolean => false ) ), of( navigator.onLine ) )
            .subscribe( (online: boolean): void => this.registryFacade.updateNetwork( online ) ) )
    }

    private handleNotification (): void {
        this.subscriptions.add( this.registryFacade.notification.subscribe( (message: ToastMessageOptions | undefined): void => {
            if (!message) return
            this.notifyService.add( message )
            this.registryFacade.ackNotification()
        } ) )
    }
}

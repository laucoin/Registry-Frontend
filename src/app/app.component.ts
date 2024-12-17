import { AsyncPipe } from '@angular/common'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ConfirmationService, MessageService, ToastMessageOptions, Translation } from 'primeng/api'
import { BlockUIModule } from 'primeng/blockui'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { ToastModule } from 'primeng/toast'
import { fromEvent, map, merge, Observable, of, Subscription } from 'rxjs'
import { AppConfig } from './app.config'
import { RegistryFacade } from './shared/util-common/state/registry.facade'
import { MessageComponent } from './shared/util-ui/message/message.component'
import { SideBarComponent } from './shell/side-bar/side-bar.component'
import { breakPoint } from './shared/util-tool/util/breakpoint.const'
import { GenericUtil } from './shared/util-tool/util/generic.util'
import { PrimeNG } from 'primeng/config'
import { Button } from 'primeng/button'

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
        AsyncPipe,
        ProgressSpinnerModule,
        MessageComponent,
        Button,
    ],
    providers: [ ConfirmationService, MessageService ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
} )
export class AppComponent implements OnInit, OnDestroy {
    protected readonly GenericUtil: typeof GenericUtil = GenericUtil
    protected readonly loading$: Observable<boolean>
    protected readonly error$: Observable<ToastMessageOptions | undefined>
    protected readonly breakPoint: object = breakPoint
    private readonly subscriptions: Subscription = new Subscription()
    private readonly themeMediaQuery: MediaQueryList = window.matchMedia( '(prefers-color-scheme: light)' )

    public constructor (
        private readonly translateService: TranslateService,
        private readonly primeConfig: PrimeNG,
        private readonly notifyService: MessageService,
        private readonly registryFacade: RegistryFacade,
    ) {
        this.loading$ = this.registryFacade.globalLoading
        this.error$ = this.registryFacade.globalError
    }

    public ngOnInit (): void {
        this.initTheme()
        this.listenThemeChange()

        this.initTranslation()

        this.handleNetwork()

        this.handleNotification()
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected signOut (): void {
        this.registryFacade.signOut()
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

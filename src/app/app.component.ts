import { ChangeDetectionStrategy, Component, HostListener, OnDestroy } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { ConfirmationService, MessageService, ToastMessageOptions } from 'primeng/api'
import { BlockUIModule } from 'primeng/blockui'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { ToastModule } from 'primeng/toast'
import { map, Subscription } from 'rxjs'
import { AppConfig } from './app.config'
import { MessageComponent } from './shared/util-ui/message/message.component'
import { SideBarComponent } from './shell/side-bar/side-bar.component'
import { breakPoint } from './shared/util-tool/util/breakpoint.const'
import { PrimeNG } from 'primeng/config'
import { Button } from 'primeng/button'
import { Dialog } from 'primeng/dialog'
import { Divider } from 'primeng/divider'
import { GenericComponent } from './shared/util-tool/component/generic.component'

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
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class AppComponent extends GenericComponent implements OnDestroy {
    protected readonly breakPoint: object = breakPoint
    private readonly subscriptions: Subscription = new Subscription()
    private readonly themeMediaQuery: MediaQueryList = window.matchMedia( '(prefers-color-scheme: light)' )

    protected readonly currentYear: number = new Date().getFullYear()
    protected readonly currentHost: string = location.host

    protected showInformationDialog: boolean = false
    protected showTermsOfUserDialog: boolean = false

    public constructor (
        private readonly primeConfig: PrimeNG,
        private readonly notifyService: MessageService,
    ) {
        super()

        this.initTranslation()
        this.handleThemeChanges()
        this.handleNotification()

        this.registryFacade.restoreTokensFromSessionStorage()
        this.registryFacade.fetchCurrentUser()
    }

    private initTranslation (): void {
        this.translateService.addLangs( AppConfig.config.languages )
        this.translateService.setDefaultLang( AppConfig.config.defaultLanguage )
        this.translateService.get( 'prime-ng' ).pipe(
            map( (lang: object): void => this.primeConfig.setTranslation( lang ) ),
        ).subscribe()
    }

    private handleThemeChanges (): void {
        this.registryFacade.updateTheme( this.theme )
        this.themeMediaQuery.addEventListener( 'change', (): void => this.registryFacade.updateTheme( this.theme ) )
    }

    private get theme (): 'light' | 'dark' {
        return (!window.matchMedia || this.themeMediaQuery.matches) ? 'light' : 'dark'
    }

    @HostListener( 'window:online', [ '$event' ] )
    @HostListener( 'window:offline', [ '$event' ] )
    public handleNetwork (): void {
        this.registryFacade.updateNetwork( navigator.onLine )
    }

    protected logout (): void {
        this.registryFacade.logout()
    }

    private handleNotification (): void {
        this.subscriptions.add(
            this.registryFacade.notification.subscribe( (message: ToastMessageOptions | undefined): void => {
                this.notifyService.add( message! )
                this.registryFacade.ackNotification()
            } ),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}

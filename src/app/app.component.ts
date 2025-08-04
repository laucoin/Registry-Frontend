import { ChangeDetectionStrategy, Component, HostListener, inject, OnDestroy } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { ConfirmationService, MessageService, ToastMessageOptions } from 'primeng/api'
import { BlockUIModule } from 'primeng/blockui'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { ToastModule } from 'primeng/toast'
import { map, Subscription } from 'rxjs'
import { AppConfig } from './app.config'
import { breakPoint } from './shared/util-tool/util/breakpoint.const'
import { PrimeNG } from 'primeng/config'
import { Button } from 'primeng/button'
import { Dialog } from 'primeng/dialog'
import { Divider } from 'primeng/divider'
import { GenericComponent } from './shared/util-tool/component/generic.component'
import { NavbarComponent } from './shell/navbar/navbar.component'
import { RouterOutlet } from '@angular/router'
import { ThemeEnum } from './shared/util-model/enumeration/theme.enum'
import { SeverityInformationComponent } from './shared/util-ui/severity-information/severity-information.component'
import { GenericUtil } from './shared/util-tool/util/generic.util'

@Component( {
    selector: 'app-root',
    standalone: true,
    imports: [
        TranslateModule,
        ConfirmDialogModule,
        ToastModule,
        BlockUIModule,
        ProgressSpinnerModule,
        Button,
        Dialog,
        Divider,
        NavbarComponent,
        RouterOutlet,
        SeverityInformationComponent,
    ],
    providers: [ ConfirmationService, MessageService ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class AppComponent extends GenericComponent implements OnDestroy {
    protected readonly breakPoint: object = breakPoint
    private readonly subscriptions: Subscription = new Subscription()

    protected readonly currentYear: number = new Date().getFullYear()
    protected readonly currentHost: string = location.host

    private readonly primeConfig: PrimeNG = inject( PrimeNG )
    private readonly notifyService: MessageService = inject( MessageService )

    protected showInformationDialog: boolean = false
    protected showTermsOfUserDialog: boolean = false

    public constructor () {
        super()

        this.initTranslation()
        this.handleThemeChanges()
        this.handleNotification()
    }

    private initTranslation (): void {
        this.translateService.addLangs( AppConfig.settings.languages )
        this.translateService.get( 'prime-ng' ).pipe(
            map( (lang: object): void => this.primeConfig.setTranslation( lang ) ),
        ).subscribe()
    }

    private handleThemeChanges (): void {
        this.registryFacade.updateTheme( GenericUtil.navigatorTheme )
        GenericUtil.themeMediaQuery.addEventListener( 'change', (): void => {
            if (GenericUtil.isNull( this.registryFacade.currentUserTheme() ) || this.registryFacade.currentUserTheme() === ThemeEnum.SYSTEM) {
                this.registryFacade.updateTheme( GenericUtil.navigatorTheme )
            }
        } )
    }

    @HostListener( 'window:online', [ '$event' ] )
    @HostListener( 'window:offline', [ '$event' ] )
    public handleNetwork (): void {
        this.registryFacade.updateNetwork( navigator.onLine )
    }

    @HostListener( 'window:resize', [ '$event' ] )
    public handleResize (): void {
        this.registryFacade.updateScreenWidth( window.innerWidth )
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

import { Component, HostListener, inject, OnDestroy} from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'
import {ConfirmationService, MessageService, ToastMessageOptions} from 'primeng/api'
import {BlockUIModule} from 'primeng/blockui'
import {ConfirmDialog} from 'primeng/confirmdialog'
import {ProgressSpinnerModule} from 'primeng/progressspinner'
import {ToastModule} from 'primeng/toast'
import {Subscription} from 'rxjs'
import {breakPoint} from '@shared/helpers/breakpoint.const'
import {PrimeNG} from 'primeng/config'
import {Button} from 'primeng/button'
import {Dialog} from 'primeng/dialog'
import {Divider} from 'primeng/divider'
import {GenericComponent} from '@shared/ui/base/generic.component'
import {NavbarComponent} from '@core/shell/navbar/navbar.component'
import {RouterOutlet} from '@angular/router'
import {ThemeEnum} from '@shared/models/enumeration/theme.enum'
import {SeverityInformationComponent} from '@shared/ui/common/severity-information/severity-information.component'
import {GenericHelper} from '@shared/helpers/generic.helper'

@Component({
    selector: 'app-root',
    imports: [
        TranslocoPipe,
        ConfirmDialog,
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
    providers: [ConfirmationService, MessageService],
    templateUrl: './registry.component.html',
    styleUrl: './registry.component.css',
})
export class RegistryComponent extends GenericComponent implements OnDestroy {
    protected readonly breakPoint: Record<string, string> = breakPoint
    private readonly subscriptions: Subscription = new Subscription()

    protected readonly currentYear: number = new Date().getFullYear()
    protected readonly currentHost: string = location.host

    private readonly primeConfig: PrimeNG = inject(PrimeNG)
    private readonly notifyService: MessageService = inject(MessageService)

    protected showInformationDialog: boolean = false
    protected showTermsOfUserDialog: boolean = false

    public constructor() {
        super()

        this.initTranslation()
        this.handleThemeChanges()
        this.handleNotification()
    }

    private initTranslation(): void {
        this.primeConfig.setTranslation(this.translateService.translateObject('prime-ng'))
    }

    private handleThemeChanges(): void {
        this.registryFacade.updateTheme(GenericHelper.navigatorTheme)
        GenericHelper.themeMediaQuery.addEventListener('change', (): void => {
            if (GenericHelper.isNull(this.registryFacade.currentUserTheme()) || this.registryFacade.currentUserTheme() === ThemeEnum.SYSTEM) {
                this.registryFacade.updateTheme(GenericHelper.navigatorTheme)
            }
        })
    }

    @HostListener('window:online')
    @HostListener('window:offline')
    public handleNetwork(): void {
        this.registryFacade.updateNetwork(navigator.onLine)
    }

    @HostListener('window:resize')
    public handleResize(): void {
        this.registryFacade.updateScreenWidth(window.innerWidth)
    }

    protected logout(): void {
        this.registryFacade.logout()
    }

    private handleNotification(): void {
        this.subscriptions.add(
            this.registryFacade.notification.subscribe((message: ToastMessageOptions): void => {
                this.notifyService.add(message)
            }),
        )
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }
}

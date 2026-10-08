import { Component, HostListener, inject, OnDestroy} from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'
import {ConfirmationService, MessageService, ToastMessageOptions} from 'primeng/api'
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
import {BrowserService} from '@core/browser/browser.service'
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
    private readonly browser: BrowserService = inject(BrowserService)
    protected readonly currentHost: string = this.browser.host

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
        this.uiFacade.updateLanguage(this.translateService.getActiveLang())
    }

    private handleThemeChanges(): void {
        this.uiFacade.updateTheme(this.browser.systemTheme)
        this.browser.onSystemThemeChange((): void => {
            if (GenericHelper.isNull(this.registryFacade.currentUserTheme()) || this.registryFacade.currentUserTheme() === ThemeEnum.SYSTEM) {
                this.uiFacade.updateTheme(this.browser.systemTheme)
            }
        })
    }

    @HostListener('window:online')
    @HostListener('window:offline')
    public handleNetwork(): void {
        this.uiFacade.updateNetwork(this.browser.online)
    }

    @HostListener('window:resize')
    public handleResize(): void {
        this.uiFacade.updateScreenWidth(this.browser.viewportWidth)
    }

    protected logout(): void {
        this.registryFacade.logout()
    }

    private handleNotification(): void {
        this.subscriptions.add(
            this.uiFacade.notification.subscribe((message: ToastMessageOptions): void => {
                this.notifyService.add(message)
            }),
        )
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }
}

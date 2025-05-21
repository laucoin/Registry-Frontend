import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core'
import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'
import { ProjectAuthorityEnum } from '../../util-model/enumeration/project-authority.enum'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { AlertStatusEnum } from '../../util-model/enumeration/alert-status.enum'
import { AlertFacade } from '../../../domains/project/alert/data/state/alert.facade'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { AlertModel } from '../../util-model/model/alert.model'
import { ElementCardComponent } from '../element-card/element-card.component'
import { SeverityCircleComponent } from '../severity-circle/severity-circle.component'
import { SeverityTagComponent } from '../severity-tag/severity-tag.component'
import { TitleCasePipe } from '@angular/common'
import { DateFormatPipe } from '../../util-tool/pipe/date-format.pipe'
import { toSignal } from '@angular/core/rxjs-interop'
import { interval, map } from 'rxjs'
import { PluralTranslationPipe } from '../../util-tool/pipe/plural-translation.pipe'
import { Button } from 'primeng/button'
import { TranslatePipe } from '@ngx-translate/core'
import { Dialog } from 'primeng/dialog'
import {
    AlertCommunicationsListComponent,
} from '../../../domains/project/alert/alert-communications-list/alert-communications-list.component'
import { Menu } from 'primeng/menu'
import { Popover } from 'primeng/popover'
import { Ripple } from 'primeng/ripple'
import { ProjectOptionIconPipe } from '../../util-tool/pipe/project-option-icon.pipe'
import { MenuItem } from 'primeng/api'
import { AlertUtil } from '../../util-tool/util/alert.util'
import { IntervalModel } from '../../util-model/model/interval.model'
import { DateUtil } from '../../util-tool/util/date.util'
import { IntervalPipe } from '../../util-tool/pipe/interval.pipe'

@Component( {
    selector: 'app-alert-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        SeverityCircleComponent,
        SeverityTagComponent,
        TitleCasePipe,
        DateFormatPipe,
        Button,
        TranslatePipe,
        Dialog,
        AlertCommunicationsListComponent,
        AlertCommunicationsListComponent,
        Menu,
        Popover,
        Ripple,
        ProjectOptionIconPipe,
    ],
    templateUrl: './alert-element.component.html',
    styleUrl: './alert-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class AlertElementComponent extends GenericElementComponent {
    protected readonly facade: AlertFacade = inject( AlertFacade )
    protected readonly pluralTranslation: PluralTranslationPipe = inject( PluralTranslationPipe )
    protected readonly intervalPipe: IntervalPipe = inject( IntervalPipe )

    protected readonly AlertStatusEnum: typeof AlertStatusEnum = AlertStatusEnum

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly addButtonVisible: InputSignal<boolean> = input( true )
    public readonly carouselView: InputSignal<boolean> = input( false )
    public readonly alert: InputSignal<AlertModel> = input.required()

    protected readonly actions: Signal<MenuItem[]> = computed( (): MenuItem[] => [
        {
            label: 'alerts.actions.resolve',
            icon: 'pi pi-check',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_U ),
            visible: this.actionIsEnable( ElementActionEnum.ALERT_RESOLVE ) && this.isInProgress() && this.alert().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        `alerts.actions.confirmations.status.${AlertStatusEnum.RESOLVED}`,
                        'pi pi-info-circle',
                        this.alert(),
                        SeverityEnum.INFO,
                        (): void => this.facade.updateAlertStatus( this.alert().id, AlertStatusEnum.RESOLVED ),
                    ),
                )
            },
        },
        {
            label: 'alerts.actions.cancel',
            icon: 'pi pi-times',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_U ),
            visible: this.actionIsEnable( ElementActionEnum.ALERT_CANCEL ) && this.isInProgress() && this.alert().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        `alerts.actions.confirmations.status.${AlertStatusEnum.CANCELED}`,
                        'pi pi-info-circle',
                        this.alert(),
                        SeverityEnum.INFO,
                        (): void => this.facade.updateAlertStatus( this.alert().id, AlertStatusEnum.CANCELED ),
                    ),
                )
            },
        },
        {
            label: 'alerts.actions.reopen',
            icon: 'pi pi-replay',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_U ),
            visible: this.actionIsEnable( ElementActionEnum.ALERT_REOPEN ) && !this.isInProgress() && this.alert().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        `alerts.actions.confirmations.status.${AlertStatusEnum.IN_PROGRESS}`,
                        'pi pi-info-circle',
                        this.alert(),
                        SeverityEnum.INFO,
                        (): void => this.facade.updateAlertStatus( this.alert().id, AlertStatusEnum.IN_PROGRESS ),
                    ),
                )
            },
        },
        {
            label: 'alerts.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_U ),
            visible: this.actionIsEnable( ElementActionEnum.ALERT_DISABLE ) && this.alert().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'alerts.actions.confirmations.disable',
                        'pi pi-exclamation-triangle',
                        this.alert(),
                        SeverityEnum.WARNING,
                        (): void => this.facade.disableAlert( this.alert().id ),
                    ),
                )
            },
        },
        {
            label: 'alerts.actions.enable',
            icon: 'pi pi-replay',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_U ),
            visible: this.actionIsEnable( ElementActionEnum.ALERT_ENABLE ) && !this.alert().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'alerts.actions.confirmations.enable',
                        'pi pi-info-circle',
                        this.alert(),
                        SeverityEnum.INFO,
                        (): void => this.facade.enableAlert( this.alert().id ),
                    ),
                )
            },
        },
        {
            id: ElementActionEnum.ALERT_DELETE,
            label: 'alerts.actions.delete',
            icon: 'pi pi-trash',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_D ),
            visible: this.actionIsEnable( ElementActionEnum.ALERT_DELETE ),
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'alerts.actions.confirmations.delete',
                        'pi pi-exclamation-triangle',
                        this.alert(),
                        SeverityEnum.DANGER,
                        (): void => this.facade.deleteAlert( this.alert() ),
                    ),
                )
            },
        },
    ] )

    protected readonly isInProgress: Signal<boolean> = computed( (): boolean => this.alert().status.value === AlertStatusEnum.IN_PROGRESS )

    protected readonly statusIcon: Signal<string> = computed( (): string => AlertUtil.getIconFromStatus( this.alert().status.value ) )
    protected readonly statusSeverity: Signal<SeverityEnum> = computed( (): SeverityEnum => AlertUtil.getSeverityFromStatus(
        this.alert().status.value ) )

    protected readonly statusLabel: Signal<string> = computed( (): string =>
        this.alert().status.label + (this.inProgressSince() ? ` (${this.intervalPipe.transform( this.inProgressSince() )!})` : ''),
    )

    private readonly inProgressSince: Signal<IntervalModel | undefined> = toSignal( interval( 1000 ).pipe(
        map( (): IntervalModel | undefined => this.getInProgressSince() ),
    ) )

    protected communicationsLayerOpened: boolean = false

    private getInProgressSince (): IntervalModel | undefined {
        if (this.alert().status.value !== AlertStatusEnum.IN_PROGRESS) return undefined
        return DateUtil.buildDateInterval( this.alert().dateTime, new Date() )
    }
}

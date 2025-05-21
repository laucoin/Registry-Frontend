import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core'
import { Card } from 'primeng/card'
import { CommunicationModel } from '../../../domains/project/communication/data/model/communication.model'
import { Avatar } from 'primeng/avatar'
import { StringUtil } from '../../util-tool/util/string.util'
import { HistoryUserModel } from '../../util-model/model/history-user.model'
import { DateFormatPipe } from '../../util-tool/pipe/date-format.pipe'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { ContextMenu } from 'primeng/contextmenu'
import { Ripple } from 'primeng/ripple'
import { TranslatePipe } from '@ngx-translate/core'
import { CommunicationUtil } from '../../util-tool/util/communication.util'
import { CommunicationFacade } from '../../../domains/project/communication/data/state/communication.facade'
import { MenuItem } from 'primeng/api'
import { ProjectAuthorityEnum } from '../../util-model/enumeration/project-authority.enum'
import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { AlertUtil } from '../../util-tool/util/alert.util'
import { MessageComponent } from '../message/message.component'
import { SeverityTagComponent } from '../severity-tag/severity-tag.component'
import { DateUtil } from '../../util-tool/util/date.util'

@Component( {
    selector: 'app-dialog-element',
    standalone: true,
    imports: [
        Card,
        Avatar,
        DateFormatPipe,
        ContextMenu,
        Ripple,
        TranslatePipe,
        MessageComponent,
        SeverityTagComponent,

    ],
    templateUrl: './dialog-element.component.html',
    styleUrl: './dialog-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class DialogElementComponent extends GenericElementComponent {
    protected readonly facade: CommunicationFacade = inject( CommunicationFacade )

    public readonly alertVisible: InputSignal<boolean> = input( false )
    public readonly communication: InputSignal<CommunicationModel> = input.required()
    public readonly previousAuthorId: InputSignal<string | undefined> = input()
    public readonly nextAuthorId: InputSignal<string | undefined> = input()

    protected readonly actions: Signal<MenuItem[]> = computed( (): MenuItem[] => [
        {
            label: 'communications.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_U ),
            visible: this.actionIsEnable( ElementActionEnum.COMMUNICATION_UPDATE ),
            command: (): void => this.facade.fetchCommunication( this.communication().id ),
        },
        {
            label: 'communications.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_U ),
            visible: this.actionIsEnable( ElementActionEnum.COMMUNICATION_DISABLE ) && this.communication().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'communications.actions.confirmations.disable',
                        'pi pi-exclamation-triangle',
                        this.communication(),
                        SeverityEnum.WARNING,
                        (): void => this.facade.disableCommunication( this.communication().id ),
                    ),
                )
            },
        },
        {
            label: 'communications.actions.enable',
            icon: 'pi pi-replay',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_U ),
            visible: this.actionIsEnable( ElementActionEnum.COMMUNICATION_ENABLE ) && !this.communication().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'communications.actions.confirmations.enable',
                        'pi pi-info-circle',
                        this.communication(),
                        SeverityEnum.INFO,
                        (): void => this.facade.enableCommunication( this.communication().id ),
                    ),
                )
            },
        },
        {
            label: 'communications.actions.delete',
            icon: 'pi pi-trash',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_D ),
            visible: this.actionIsEnable( ElementActionEnum.COMMUNICATION_DELETE ),
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'communications.actions.confirmations.delete',
                        'pi pi-exclamation-triangle',
                        this.communication(),
                        SeverityEnum.INFO,
                        (): void => this.facade.deleteCommunication( this.communication() ),
                    ),
                )
            },
        },
    ] )

    protected readonly firstAuthorMessage: Signal<boolean> = computed( (): boolean =>
        CommunicationUtil.getAuthorId( this.communication() ) !== this.previousAuthorId(),
    )

    protected readonly lastAuthorMessage: Signal<boolean> = computed( (): boolean =>
        CommunicationUtil.getAuthorId( this.communication() ) !== this.nextAuthorId(),
    )

    protected readonly authorIsCurrentUser: Signal<boolean> = computed(
        (): boolean => this.buildAuthorIsCurrentUser( this.communication(), this.registryFacade.currentUser() ),
    )

    protected readonly authorName: Signal<string> = computed( (): string => this.buildAuthorName( this.communication() ) )

    protected readonly alertSeverity: Signal<SeverityEnum | undefined> = computed( (): SeverityEnum | undefined => AlertUtil.getSeverityFromStatus(
        this.communication().alert?.status?.value ) )

    protected readonly updated: Signal<boolean> = computed( (): boolean =>
        DateUtil.isAfter( this.communication().lastEdition.dateTime, this.communication().creation.dateTime ),
    )

    private buildAuthorIsCurrentUser (
        communication: CommunicationModel,
        currentUser: CurrentUserModel | undefined,
    ): boolean {
        return StringUtil.isNullOrBlank( communication.movement?.reason?.label ) && communication?.lastEdition?.user?.id === currentUser?.id
    }


    private buildAuthorName (communication: CommunicationModel): string {
        switch (true) {
            case StringUtil.isNotNullNorBlank( communication.movement?.reason?.label ):
                return communication.movement!.reason!.label!
            case StringUtil.isNotNullNorBlank( communication.lastEdition?.user?.firstName ): {
                const lastEditor: HistoryUserModel = communication.lastEdition!.user!
                return `${lastEditor.firstName} ${lastEditor.lastName}`
            }
            default:
                return this.translateService.instant( 'communications.no-author' )
        }
    }
}

import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, signal, Signal } from '@angular/core'
import { CommunicationModel } from '../data/model/communication.model'
import { GenericElementComponent } from '../../../../shared/util-tool/component/generic-element.component'
import { CommunicationFacade } from '../data/state/communication.facade'
import { ActionModel } from '../../../../shared/util-model/model/action.model'
import { ElementActionEnum } from '../../../../shared/util-model/enumeration/element-action.enum'
import { ProjectAuthorityEnum } from '../../../../shared/util-model/enumeration/project-authority.enum'
import { SeverityEnum } from '../../../../shared/util-model/enumeration/severity.enum'
import { AppConfig } from '../../../../app.config'
import { AppRouteEnum } from '../../../../app-route.enum'
import {
    ConfirmationDialogComponent,
} from '../../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'
import { ElementCardComponent } from '../../../../shared/util-ui/element-card/element-card.component'
import { SeverityCircleComponent } from '../../../../shared/util-ui/severity-circle/severity-circle.component'
import { DateFormatPipe } from '../../../../shared/util-tool/pipe/date-format.pipe'
import { ProjectOptionIconPipe } from '../../../../shared/util-tool/pipe/project-option-icon.pipe'
import { TranslatePipe } from '@ngx-translate/core'

@Component( {
    selector: 'app-communication-element',
    standalone: true,
    imports: [
        ConfirmationDialogComponent,
        ElementCardComponent,
        SeverityCircleComponent,
        DateFormatPipe,
        ProjectOptionIconPipe,
        TranslatePipe,
    ],
    templateUrl: './communication-element.component.html',
    styleUrl: './communication-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class CommunicationElementComponent extends GenericElementComponent<CommunicationModel> {
    protected readonly facade: CommunicationFacade = inject( CommunicationFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly communication: InputSignal<CommunicationModel> = input.required()

    private readonly allActions: Signal<ActionModel[]> = signal( [
        {
            id: ElementActionEnum.COMMUNICATION_UPDATE,
            label: 'communications.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_U,
            requiredProjectOption: undefined,
            confirmation: undefined,
        },
        {
            id: ElementActionEnum.COMMUNICATION_DISABLE,
            label: 'communications.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_U,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'communications.actions.confirmations.disable.title',
                message: 'communications.actions.confirmations.disable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
        {
            id: ElementActionEnum.COMMUNICATION_ENABLE,
            label: 'communications.actions.enable',
            icon: 'pi pi-replay',
            disabled: true,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_U,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'communications.actions.confirmations.enable.title',
                message: 'communications.actions.confirmations.enable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
        {
            id: ElementActionEnum.COMMUNICATION_DELETE,
            label: 'communications.actions.delete',
            icon: 'pi pi-trash',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_COMMUNICATION_D,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'communications.actions.confirmations.delete.title',
                message: 'communications.actions.confirmations.delete.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.DANGER,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
    ] )

    protected readonly actions: Signal<ActionModel[]>

    public constructor () {
        super()

        this.actions = computed( (): ActionModel[] => this.buildActions(
            this.communication(),
            this.allActions(),
        ) )
    }

    protected isActionVisible (element: CommunicationModel, action: ActionModel): boolean {
        if (!AppConfig.config.communication.actions.includes( action.id )) return false

        switch (action.id) {
            case ElementActionEnum.COMMUNICATION_DISABLE:
                return element.visible
            case ElementActionEnum.COMMUNICATION_ENABLE:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: ElementActionEnum): void {
        switch (action) {
            case ElementActionEnum.COMMUNICATION_UPDATE:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_COMMUNICATIONS_EDITION.replace( ':communicationId', this.communication().id ),
                ).catch( console.error )
                break
            case ElementActionEnum.COMMUNICATION_DISABLE:
                this.facade.disableCommunication( this.communication().id )
                break
            case ElementActionEnum.COMMUNICATION_ENABLE:
                this.facade.enableCommunication( this.communication().id )
                break
            case ElementActionEnum.COMMUNICATION_DELETE:
                this.facade.deleteCommunication( this.communication() )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}

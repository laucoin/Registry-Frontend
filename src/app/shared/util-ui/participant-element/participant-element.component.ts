import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    InputSignal,
    signal,
    Signal,
} from '@angular/core'
import { ParticipantModel } from '../../util-model/model/participant.model'
import { ActionModel } from '../../util-model/model/action.model'
import { ParticipantFacade } from '../../../domains/project/configuration/participant/data/state/participant.facade'
import { ElementCardComponent } from '../element-card/element-card.component'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { AppRouteEnum } from '../../../app-route.enum'
import { Avatar } from 'primeng/avatar'
import { LayerComponent } from '../layer/layer.component'
import { Listbox } from 'primeng/listbox'
import { GroupFacade } from '../../../domains/project/configuration/group/data/state/group.facade'
import { SeverityTagComponent } from '../severity-tag/severity-tag.component'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { PluralTranslationPipe } from '../../util-tool/pipe/plural-translation.pipe'
import { CustomDateFormatPipe } from '../../util-tool/pipe/custom-date-format.pipe'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'
import { ParticipantTypeEnum } from '../../util-model/enumeration/participant-type.enum'
import { SeverityCircleComponent } from '../severity-circle/severity-circle.component'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { PresenceStatusEnum } from '../../util-model/enumeration/presence-status.enum'
import { ProjectAuthorityEnum } from '../../util-model/enumeration/project-authority.enum'
import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'
import { AppConfig } from '../../../app.config'

@Component( {
    selector: 'app-participant-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TitleCasePipe,
        UpperCasePipe,
        TranslateModule,
        Avatar,
        LayerComponent,
        Listbox,
        SeverityTagComponent,
        PluralTranslationPipe,
        CustomDateFormatPipe,
        ConfirmationDialogComponent,
        SeverityCircleComponent,
    ],
    providers: [ GroupFacade ],
    templateUrl: './participant-element.component.html',
    styleUrl: './participant-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ParticipantElementComponent extends GenericElementComponent<ParticipantModel> {
    protected readonly facade: ParticipantFacade = inject( ParticipantFacade )
    private readonly groupFacade: GroupFacade = inject( GroupFacade )

    protected ParticipantTypeEnum: typeof ParticipantTypeEnum = ParticipantTypeEnum

    protected layerOpened: boolean = false

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly groupIdToRemove: InputSignal<string | undefined> = input()
    public readonly participant: InputSignal<ParticipantModel> = input.required()

    private readonly allActions: Signal<ActionModel[]> = signal( [
        {
            id: ElementActionEnum.PARTICIPANT_CONSULT_MOVEMENTS,
            label: 'participants.actions.movements-history',
            icon: 'pi pi-history',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_HISTORY_R,
        },
        {
            id: ElementActionEnum.PARTICIPANT_UPDATE,
            label: 'participants.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U,
        },
        {
            id: ElementActionEnum.PARTICIPANT_DISABLE,
            label: 'participants.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U,
            confirmation: {
                header: 'participants.actions.confirmations.disable.title',
                message: 'participants.actions.confirmations.disable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.PARTICIPANT_ENABLE,
            label: 'participants.actions.enable',
            icon: 'pi pi-replay',
            disabled: true,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U,
            confirmation: {
                header: 'participants.actions.confirmations.enable.title',
                message: 'participants.actions.confirmations.enable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.PARTICIPANT_REMOVE_FROM_GROUP,
            label: 'participants.actions.remove-member',
            icon: 'pi pi-user-minus',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U,
            confirmation: {
                header: 'participants.actions.confirmations.remove-member.title',
                message: 'participants.actions.confirmations.remove-member.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.PARTICIPANT_DELETE,
            label: 'participants.actions.delete',
            icon: 'pi pi-trash',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_D,
            confirmation: {
                header: 'participants.actions.confirmations.delete.title',
                message: 'participants.actions.confirmations.delete.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.DANGER,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: 'firstName',
            },
        },
    ] )

    protected readonly participantStatusSeverity: Signal<SeverityEnum>
    protected readonly actions: Signal<ActionModel[]>
    protected readonly additionalTotal: Signal<number>

    public constructor () {
        super()
        this.participantStatusSeverity = computed( (): SeverityEnum => {
            switch (this.participant().status.value) {
                case PresenceStatusEnum.IN:
                    return SeverityEnum.SUCCESS
                case PresenceStatusEnum.OUT:
                    return SeverityEnum.WARNING
                default:
                    return SeverityEnum.SECONDARY
            }
        } )

        this.actions = computed( (): ActionModel[] => this.buildActions(
            this.participant(),
            this.allActions(),
        ) )

        this.additionalTotal = computed( (): number => this.participant().groups.length - 1 )
    }

    protected isActionVisible (
        element: ParticipantModel,
        action: ActionModel,
    ): boolean {
        if (!AppConfig.config.participant.actions.includes( action.id )) return false

        switch (action.id) {
            case ElementActionEnum.PARTICIPANT_REMOVE_FROM_GROUP:
                return GenericUtil.nonNull( this.groupIdToRemove() )
            case ElementActionEnum.PARTICIPANT_DISABLE:
                return element.visible
            case ElementActionEnum.PARTICIPANT_ENABLE:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: ElementActionEnum): void {
        switch (action) {
            case ElementActionEnum.PARTICIPANT_CONSULT_MOVEMENTS:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS_MOVEMENTS.replace(
                        ':participantId',
                        this.participant().id,
                    ),
                ).catch( console.error )
                break
            case ElementActionEnum.PARTICIPANT_UPDATE:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS_EDITION.replace(
                        ':participantId',
                        this.participant().id,
                    ),
                ).catch( console.error )
                break
            case ElementActionEnum.PARTICIPANT_REMOVE_FROM_GROUP:
                this.groupFacade.removeMemberFromGroup(
                    this.groupIdToRemove()!,
                    this.participant(),
                )
                break
            case ElementActionEnum.PARTICIPANT_DISABLE:
                this.facade.disableParticipant( this.participant().id )
                break
            case ElementActionEnum.PARTICIPANT_ENABLE:
                this.facade.enableParticipant( this.participant().id )
                break
            case ElementActionEnum.PARTICIPANT_DELETE:
                this.facade.deleteParticipant( this.participant() )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}

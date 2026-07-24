import {ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal} from '@angular/core'
import {ParticipantModel} from '../../util-model/model/participant.model'
import {ParticipantFacade} from '../../../domains/project/configuration/participant/data/state/participant.facade'
import {ElementCardComponent} from '../element-card/element-card.component'
import {TitleCasePipe, UpperCasePipe} from '@angular/common'
import {TranslatePipe} from '@ngx-translate/core'
import {AppRouteEnum} from '../../../app-route.enum'
import {Avatar} from 'primeng/avatar'
import {LayerComponent} from '../layer/layer.component'
import {Listbox} from 'primeng/listbox'
import {GroupFacade} from '../../../domains/project/configuration/group/data/state/group.facade'
import {SeverityTagComponent} from '../severity-tag/severity-tag.component'
import {GenericElementComponent} from '../../util-tool/component/generic-element.component'
import {PluralTranslationPipe} from '../../util-tool/pipe/plural-translation.pipe'
import {CustomDateFormatPipe} from '../../util-tool/pipe/custom-date-format.pipe'
import {GenericUtil} from '../../util-tool/util/generic.util'
import {ParticipantTypeEnum} from '../../util-model/enumeration/participant-type.enum'
import {SeverityCircleComponent} from '../severity-circle/severity-circle.component'
import {SeverityEnum} from '../../util-model/enumeration/severity.enum'
import {PresenceStatusEnum} from '../../util-model/enumeration/presence-status.enum'
import {ProjectAuthorityEnum} from '../../util-model/enumeration/project-authority.enum'
import {ElementActionEnum} from '../../util-model/enumeration/element-action.enum'
import {MenuItem} from 'primeng/api'

@Component({
    selector: 'app-participant-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TitleCasePipe,
        UpperCasePipe,
        TranslatePipe,
        Avatar,
        LayerComponent,
        Listbox,
        SeverityTagComponent,
        PluralTranslationPipe,
        CustomDateFormatPipe,
        SeverityCircleComponent,
    ],
    providers: [GroupFacade],
    templateUrl: './participant-element.component.html',
    styleUrl: './participant-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantElementComponent extends GenericElementComponent {
    protected readonly facade: ParticipantFacade = inject(ParticipantFacade)
    private readonly groupFacade: GroupFacade = inject(GroupFacade)

    protected ParticipantTypeEnum: typeof ParticipantTypeEnum = ParticipantTypeEnum

    protected layerOpened: boolean = false

    public readonly actionMenuVisible: InputSignal<boolean> = input(true)
    public readonly groupIdToRemove: InputSignal<string | undefined> = input()
    public readonly participant: InputSignal<ParticipantModel> = input.required()

    protected readonly actions: Signal<MenuItem[]> = computed((): MenuItem[] => [
        {
            label: 'participants.actions.movements-history',
            icon: 'pi pi-history',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_HISTORY_R),
            visible: this.actionIsEnable(ElementActionEnum.PARTICIPANT_CONSULT_MOVEMENTS),
            command: (): void => {
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS_MOVEMENTS.replace(
                        ':participantId',
                        this.participant().id,
                    ),
                ).catch(console.error)
            },
        },
        {
            label: 'participants.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U),
            visible: this.actionIsEnable(ElementActionEnum.PARTICIPANT_UPDATE),
            command: (): void => {
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS_EDITION.replace(
                        ':participantId',
                        this.participant().id,
                    ),
                ).catch(console.error)
            },
        },
        {
            label: 'participants.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U),
            visible: this.actionIsEnable(ElementActionEnum.PARTICIPANT_DISABLE) && this.participant().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'participants.actions.confirmations.disable',
                        'pi pi-exclamation-triangle',
                        this.participant(),
                        SeverityEnum.WARNING,
                        (): void => this.facade.disableParticipant(this.participant().id),
                    ),
                )
            },
        },
        {
            label: 'participants.actions.enable',
            icon: 'pi pi-replay',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_U),
            visible: this.actionIsEnable(ElementActionEnum.PARTICIPANT_ENABLE) && !this.participant().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'participants.actions.confirmations.enable',
                        'pi pi-info-circle',
                        this.participant(),
                        SeverityEnum.INFO,
                        (): void => this.facade.enableParticipant(this.participant().id),
                    ),
                )
            },
        },
        {
            label: 'participants.actions.remove-member',
            icon: 'pi pi-user-minus',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U),
            visible: this.actionIsEnable(ElementActionEnum.PARTICIPANT_REMOVE_FROM_GROUP) && GenericUtil.nonNull(this.groupIdToRemove()),
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'participants.actions.confirmations.remove-member',
                        'pi pi-exclamation-triangle',
                        this.participant(),
                        SeverityEnum.WARNING,
                        (): void => this.groupFacade.removeMemberFromGroup(
                            this.groupIdToRemove()!,
                            this.participant(),
                        ),
                    ),
                )
            },
        },
        {
            label: 'participants.actions.delete',
            icon: 'pi pi-trash',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_D),
            visible: this.actionIsEnable(ElementActionEnum.PARTICIPANT_DELETE) && this.participant().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'participants.actions.confirmations.delete',
                        'pi pi-exclamation-triangle',
                        this.participant(),
                        SeverityEnum.DANGER,
                        (): void => this.facade.deleteParticipant(this.participant()),
                    ),
                )
            },
        },
    ])

    protected readonly participantStatusSeverity: Signal<SeverityEnum> = computed((): SeverityEnum => {
        switch (this.participant().status.value) {
            case PresenceStatusEnum.IN:
                return SeverityEnum.SUCCESS
            case PresenceStatusEnum.OUT:
                return SeverityEnum.WARNING
            default:
                return SeverityEnum.SECONDARY
        }
    })

    protected readonly additionalTotal: Signal<number> = computed((): number => (this.participant().groups?.length ?? 0) - 1)
}

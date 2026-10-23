import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core'
import { GroupModel } from '@shared/models/model/group.model'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { ElementCardComponent } from '@shared/ui/element-card/element-card.component'
import { TranslatePipe } from '@ngx-translate/core'
import { TitleCasePipe } from '@angular/common'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { SeverityTagComponent } from '@shared/ui/severity-tag/severity-tag.component'
import { GenericElementComponent } from '@shared/ui/base/generic-element.component'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { SeverityCircleComponent } from '@shared/ui/severity-circle/severity-circle.component'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { MenuItem } from 'primeng/api'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'

@Component( {
    selector: 'app-group-element',
    imports: [
        ElementCardComponent,
        TranslatePipe,
        TitleCasePipe,
        SeverityTagComponent,
        PluralTranslationPipe,
        CustomDateFormatPipe,
        SeverityCircleComponent,
    ],
    templateUrl: './group-element.component.html',
    styleUrl: './group-element.component.scss',
} )
export class GroupElementComponent extends GenericElementComponent {
    protected readonly facade: GroupFacade = inject( GroupFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly group: InputSignal<GroupModel> = input.required()

    protected readonly actions: Signal<MenuItem[]> = computed( (): MenuItem[] => [
        {
            label: 'groups.actions.members',
            icon: 'pi pi-users',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R ),
            visible: this.actionIsEnable( ElementActionEnum.GROUP_CONSULT_MEMBERS ),
            command: (): void => {
                this.router.navigateByUrl(
                    RegistryRouteEnum.PROJECTS_CONFIGURATION_GROUPS_MEMBERS.replace( ':groupId', this.group().id ).replace(':projectId', this.registryFacade.currentProjectId() ?? ''),
                ).catch( console.error )
            },
        },
        {
            id: ElementActionEnum.GROUP_UPDATE,
            label: 'groups.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U ),
            visible: this.actionIsEnable( ElementActionEnum.GROUP_UPDATE ),
            command: (): void => {
                this.router.navigateByUrl(
                    RegistryRouteEnum.PROJECTS_CONFIGURATION_GROUPS_EDITION.replace( ':groupId', this.group().id ).replace(':projectId', this.registryFacade.currentProjectId() ?? ''),
                ).catch( console.error )
            },
        },
        {
            label: 'groups.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: this.busy() || !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U ),
            visible: this.actionIsEnable(ElementActionEnum.GROUP_DISABLE ) && this.group().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'groups.actions.confirmations.disable',
                        'pi pi-exclamation-triangle',
                        this.group(),
                        SeverityEnum.WARNING,
                        (): void => this.run(this.facade.disableGroup(this.group().id)),
                    ),
                )
            },
        },
        {
            label: 'groups.actions.enable',
            icon: 'pi pi-replay',
            disabled: this.busy() || !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U ),
            visible: this.actionIsEnable(ElementActionEnum.GROUP_ENABLE ) && !this.group().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'groups.actions.confirmations.enable',
                        'pi pi-info-circle',
                        this.group(),
                        SeverityEnum.INFO,
                        (): void => this.run(this.facade.enableGroup(this.group().id)),
                    ),
                )
            },
        },
        {
            label: 'groups.actions.delete',
            icon: 'pi pi-trash',
            disabled: this.busy() || !this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_D ),
            visible: this.actionIsEnable(ElementActionEnum.GROUP_DELETE ),
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'groups.actions.confirmations.delete',
                        'pi pi-exclamation-triangle',
                        this.group(),
                        SeverityEnum.DANGER,
                        (): void => this.run(this.facade.deleteGroup(this.group())),
                    ),
                )
            },
        },
    ] )

    protected readonly statusSeverity: Signal<SeverityEnum> = computed( (): SeverityEnum =>
        this.group().status?.value === AvailabilityStatusEnum.AVAILABLE ? SeverityEnum.SUCCESS : SeverityEnum.INFO,
    )
}

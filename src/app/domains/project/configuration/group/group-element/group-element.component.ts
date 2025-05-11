import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, signal, Signal } from '@angular/core'
import { GroupModel } from '../../../../../shared/util-model/model/group.model'
import { AppConfig } from '../../../../../app.config'
import { ActionModel } from '../../../../../shared/util-model/model/action.model'
import { GroupFacade } from '../data/state/group.facade'
import { ElementCardComponent } from '../../../../../shared/util-ui/element-card/element-card.component'
import { TranslatePipe } from '@ngx-translate/core'
import { TitleCasePipe } from '@angular/common'
import { AppRouteEnum } from '../../../../../app-route.enum'
import { SeverityTagComponent } from '../../../../../shared/util-ui/severity-tag/severity-tag.component'
import { DateIntervalStatusModel } from '../../../../../shared/util-model/model/date-interval-status.model'
import { DateUtil } from '../../../../../shared/util-tool/util/date.util'
import { GenericElementComponent } from '../../../../../shared/util-tool/component/generic-element.component'
import { PluralTranslationPipe } from '../../../../../shared/util-tool/pipe/plural-translation.pipe'
import { IntervalFormatPipe } from '../../../../../shared/util-tool/pipe/interval-format.pipe'
import { CustomDateFormatPipe } from '../../../../../shared/util-tool/pipe/custom-date-format.pipe'
import {
    ConfirmationDialogComponent,
} from '../../../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'
import { SeverityCircleComponent } from '../../../../../shared/util-ui/severity-circle/severity-circle.component'
import { ProjectAuthorityEnum } from '../../../../../shared/util-model/enumeration/project-authority.enum'
import { SeverityEnum } from '../../../../../shared/util-model/enumeration/severity.enum'
import { ElementActionEnum } from '../../../../../shared/util-model/enumeration/element-action.enum'

@Component( {
    selector: 'app-group-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TranslatePipe,
        TitleCasePipe,
        SeverityTagComponent,
        PluralTranslationPipe,
        IntervalFormatPipe,
        CustomDateFormatPipe,
        ConfirmationDialogComponent,
        SeverityCircleComponent,
    ],
    templateUrl: './group-element.component.html',
    styleUrl: './group-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class GroupElementComponent extends GenericElementComponent<GroupModel> {
    protected readonly facade: GroupFacade = inject( GroupFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly group: InputSignal<GroupModel> = input.required()

    private readonly allActions: Signal<ActionModel[]> = signal( [
        {
            id: ElementActionEnum.GROUP_CONSULT_MEMBERS,
            label: 'groups.actions.members',
            icon: 'pi pi-users',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R,
        },
        {
            id: ElementActionEnum.GROUP_UPDATE,
            label: 'groups.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U,
        },
        {
            id: ElementActionEnum.GROUP_DISABLE,
            label: 'groups.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U,
            confirmation: {
                header: 'groups.actions.confirmations.disable.title',
                message: 'groups.actions.confirmations.disable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.GROUP_ENABLE,
            label: 'groups.actions.enable',
            icon: 'pi pi-replay',
            disabled: true,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U,
            confirmation: {
                header: 'groups.actions.confirmations.enable.title',
                message: 'groups.actions.confirmations.enable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.GROUP_DELETE,
            label: 'groups.actions.delete',
            icon: 'pi pi-trash',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_D,
            confirmation: {
                header: 'groups.actions.confirmations.delete.title',
                message: 'groups.actions.confirmations.delete.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.DANGER,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: 'name',
            },
        },
    ] )
    protected readonly actions: Signal<ActionModel[]>
    protected readonly intervalStatus: Signal<DateIntervalStatusModel | undefined>

    public constructor () {
        super()

        this.intervalStatus = computed( (): DateIntervalStatusModel => DateUtil.dateRangeStatus(
            this.group().startAvailability,
            this.group().endAvailability,
        ) )

        this.actions = computed( (): ActionModel[] => this.buildActions(
            this.group(),
            this.allActions(),
        ) )
    }

    protected isActionVisible (element: GroupModel, action: ActionModel): boolean {
        if (!AppConfig.config.group.actions.includes( action.id )) return false

        switch (action.id) {
            case ElementActionEnum.GROUP_DISABLE:
                return element.visible
            case ElementActionEnum.GROUP_ENABLE:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: ElementActionEnum): void {
        switch (action) {
            case ElementActionEnum.GROUP_CONSULT_MEMBERS:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_GROUPS_MEMBERS.replace( ':groupId', this.group().id ),
                ).catch( console.error )
                break
            case ElementActionEnum.GROUP_UPDATE:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_GROUPS_EDITION.replace( ':groupId', this.group().id ),
                ).catch( console.error )
                break
            case ElementActionEnum.GROUP_DISABLE:
                this.facade.disableGroup( this.group().id )
                break
            case ElementActionEnum.GROUP_ENABLE:
                this.facade.enableGroup( this.group().id )
                break
            case ElementActionEnum.GROUP_DELETE:
                this.facade.deleteGroup( this.group() )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}

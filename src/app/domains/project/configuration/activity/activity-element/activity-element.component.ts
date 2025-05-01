import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, signal, Signal } from '@angular/core'
import { ElementCardComponent } from '../../../../../shared/util-ui/element-card/element-card.component'
import { TagModule } from 'primeng/tag'
import { TranslateModule } from '@ngx-translate/core'
import { AppConfig } from '../../../../../app.config'
import { ChipModule } from 'primeng/chip'
import { ActionModel } from '../../../../../shared/util-model/model/action.model'
import { AppRouteEnum } from '../../../../../app-route.enum'
import { ActivityFacade } from '../data/state/activity.facade'
import { SeverityTagComponent } from '../../../../../shared/util-ui/severity-tag/severity-tag.component'
import { DateIntervalStatusModel } from '../../../../../shared/util-model/model/date-interval-status.model'
import { DateUtil } from '../../../../../shared/util-tool/util/date.util'
import { GenericElementComponent } from '../../../../../shared/util-tool/component/generic-element.component'
import { ActivityModel } from '../../../../../shared/util-model/model/activity.model'
import { IntervalFormatPipe } from '../../../../../shared/util-tool/pipe/interval-format.pipe'
import { CustomDateFormatPipe } from '../../../../../shared/util-tool/pipe/custom-date-format.pipe'
import { ReactiveFormsModule } from '@angular/forms'
import {
    ConfirmationDialogComponent,
} from '../../../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'
import { SeverityCircleComponent } from '../../../../../shared/util-ui/severity-circle/severity-circle.component'
import { ProjectAuthorityEnum } from '../../../../../shared/util-model/enumeration/project-authority.enum'
import { SeverityEnum } from '../../../../../shared/util-model/enumeration/severity.enum'
import { ElementActionEnum } from '../../../../../shared/util-model/enumeration/element-action.enum'
import { ProjectOptionEnum } from '../../../../../shared/util-model/enumeration/project-option.enum'

@Component( {
    selector: 'app-activity-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TagModule,
        TranslateModule,
        ChipModule,
        SeverityTagComponent,
        IntervalFormatPipe,
        CustomDateFormatPipe,
        ReactiveFormsModule,
        ConfirmationDialogComponent,
        SeverityCircleComponent,
    ],
    templateUrl: './activity-element.component.html',
    styleUrl: './activity-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ActivityElementComponent extends GenericElementComponent<ActivityModel> {
    protected readonly facade: ActivityFacade = inject( ActivityFacade )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly activity: InputSignal<ActivityModel> = input.required()

    private readonly allActions: Signal<ActionModel[]> = signal( [
        {
            id: ElementActionEnum.ACTIVITY_CONSULT_MOVEMENTS,
            label: 'activities.actions.movements-history',
            icon: 'pi pi-history',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_HISTORY_R,
            requiredProjectOption: ProjectOptionEnum.ACTIVITY,
            confirmation: undefined,
        },
        {
            id: ElementActionEnum.ACTIVITY_UPDATE,
            label: 'activities.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U,
            requiredProjectOption: ProjectOptionEnum.ACTIVITY,
            confirmation: undefined,
        },
        {
            id: ElementActionEnum.ACTIVITY_DISABLE,
            label: 'activities.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U,
            requiredProjectOption: ProjectOptionEnum.ACTIVITY,
            confirmation: {
                header: 'activities.actions.confirmations.disable.title',
                message: 'activities.actions.confirmations.disable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
        {
            id: ElementActionEnum.ACTIVITY_ENABLE,
            label: 'activities.actions.enable',
            icon: 'pi pi-replay',
            disabled: true,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U,
            requiredProjectOption: ProjectOptionEnum.ACTIVITY,
            confirmation: {
                header: 'activities.actions.confirmations.enable.title',
                message: 'activities.actions.confirmations.enable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
        {
            id: ElementActionEnum.ACTIVITY_DELETE,
            label: 'activities.actions.delete',
            icon: 'pi pi-trash',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_D,
            requiredProjectOption: ProjectOptionEnum.ACTIVITY,
            confirmation: {
                header: 'activities.actions.confirmations.delete.title',
                message: 'activities.actions.confirmations.delete.message',
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
            this.activity().startAvailability,
            this.activity().endAvailability,
        ) )

        this.actions = computed( (): ActionModel[] => this.buildActions(
            this.activity(),
            this.allActions(),
        ) )
    }

    protected isActionVisible (element: ActivityModel, action: ActionModel): boolean {
        if (!AppConfig.config.activity.actions.includes( action.id )) return false

        switch (action.id) {
            case ElementActionEnum.ACTIVITY_DISABLE:
                return element.visible
            case ElementActionEnum.ACTIVITY_ENABLE:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: ElementActionEnum): void {
        switch (action) {
            case ElementActionEnum.ACTIVITY_CONSULT_MOVEMENTS:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES_MOVEMENTS.replace(
                        ':activityId',
                        this.activity().id,
                    ),
                ).catch( console.error )
                break
            case ElementActionEnum.ACTIVITY_UPDATE:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES_EDITION.replace( ':activityId', this.activity().id ),
                ).catch( console.error )
                break
            case ElementActionEnum.ACTIVITY_DISABLE:
                this.facade.disableActivity( this.activity().id )
                break
            case ElementActionEnum.ACTIVITY_ENABLE:
                this.facade.enableActivity( this.activity().id )
                break
            case ElementActionEnum.ACTIVITY_DELETE:
                this.facade.deleteActivity( this.activity() )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}

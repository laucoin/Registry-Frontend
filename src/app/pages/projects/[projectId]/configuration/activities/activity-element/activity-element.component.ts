import { Component, computed, inject, input, InputSignal, Signal} from '@angular/core'
import {ElementCardComponent} from '@shared/ui/common/element-card/element-card.component'
import {TagModule} from 'primeng/tag'
import {TranslocoPipe} from '@jsverse/transloco'
import {ChipModule} from 'primeng/chip'
import {RegistryRouteEnum} from '@core/routing/registry-route.enum'
import {ActivityFacade} from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import {SeverityTagComponent} from '@shared/ui/common/severity-tag/severity-tag.component'
import {GenericElementComponent} from '@shared/ui/base/generic-element.component'
import {ActivityModel} from '@shared/models/model/activity.model'
import {CustomDateFormatPipe} from '@shared/helpers/pipe/custom-date-format.pipe'
import {ReactiveFormsModule} from '@angular/forms'
import {SeverityCircleComponent} from '@shared/ui/common/severity-circle/severity-circle.component'
import {ProjectAuthorityEnum} from '@shared/models/enumeration/project-authority.enum'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'
import {ElementActionEnum} from '@shared/models/enumeration/element-action.enum'
import {ProjectOptionIconPipe} from '@shared/helpers/pipe/project-option-icon.pipe'
import {MenuItem} from 'primeng/api'
import {AvailabilityStatusEnum} from '@shared/models/enumeration/availability-status.enum'
import {MessageComponent} from '@shared/ui/common/message/message.component'

/**
 * Purpose: Card presenting one activity with its actions.
 * Scope: Renders the details, the actions menu and the confirmations of the element.
 * Limits: Receives the element as an input and calls the facade for commands; it holds no list state.
 */
@Component({
    selector: 'app-activity-element',
    imports: [
        ElementCardComponent,
        TagModule,
        TranslocoPipe,
        ChipModule,
        SeverityTagComponent,
        CustomDateFormatPipe,
        ReactiveFormsModule,
        SeverityCircleComponent,
        ProjectOptionIconPipe,
        MessageComponent,
    ],
    templateUrl: './activity-element.component.html',
    styleUrl: './activity-element.component.css',
})
export class ActivityElementComponent extends GenericElementComponent {
    protected readonly facade: ActivityFacade = inject(ActivityFacade)

    public readonly actionMenuVisible: InputSignal<boolean> = input(true)
    public readonly activity: InputSignal<ActivityModel> = input.required()

    protected readonly actions: Signal<MenuItem[]> = computed( (): MenuItem[] => [
        this.movementsHistoryAction(),
        this.editAction(),
        this.disableAction(),
        this.enableAction(),
        this.deleteAction(),
    ] )

    private movementsHistoryAction(): MenuItem {
        return {
            label: 'activities.actions.movements-history',
            icon: 'pi pi-history',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_HISTORY_R),
            visible: this.actionIsEnable(ElementActionEnum.ACTIVITY_CONSULT_MOVEMENTS),
            command: (): void => {
                this.router.navigateByUrl(
                    RegistryRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES_MOVEMENTS.replace(
                        ':activityId',
                        this.activity().id,
                    ).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
                ).catch(console.error)
            },
        }
    }

    private editAction(): MenuItem {
        return {
            label: 'activities.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U),
            visible: this.actionIsEnable(ElementActionEnum.ACTIVITY_UPDATE),
            command: (): void => {
                this.router.navigateByUrl(
                    RegistryRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES_EDITION.replace(':activityId', this.activity().id).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
                ).catch(console.error)
            },
        }
    }

    private disableAction(): MenuItem {
        return {
            label: 'activities.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: this.busy() || !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U),
            visible: this.actionIsEnable(ElementActionEnum.ACTIVITY_DISABLE) && this.activity().visible,
            command: this.confirmThen(
                'activities.actions.confirmations.disable',
                'pi pi-exclamation-triangle',
                this.activity(),
                SeverityEnum.WARNING,
                (): void => this.run(this.facade.disableActivity(this.activity().id)),
            ),
        }
    }

    private enableAction(): MenuItem {
        return {
            label: 'activities.actions.enable',
            icon: 'pi pi-replay',
            disabled: this.busy() || !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U),
            visible: this.actionIsEnable(ElementActionEnum.ACTIVITY_ENABLE) && !this.activity().visible,
            command: this.confirmThen(
                'activities.actions.confirmations.enable',
                'pi pi-info-circle',
                this.activity(),
                SeverityEnum.INFO,
                (): void => this.run(this.facade.enableActivity(this.activity().id)),
            ),
        }
    }

    private deleteAction(): MenuItem {
        return {
            id: ElementActionEnum.ACTIVITY_DELETE,
            label: 'activities.actions.delete',
            icon: 'pi pi-trash',
            disabled: this.busy() || !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_D),
            visible: this.actionIsEnable(ElementActionEnum.ACTIVITY_DELETE),
            command: this.confirmThen(
                'activities.actions.confirmations.delete',
                'pi pi-exclamation-triangle',
                this.activity(),
                SeverityEnum.DANGER,
                (): void => this.run(this.facade.deleteActivity(this.activity())),
            ),
        }
    }

    protected readonly statusSeverity: Signal<SeverityEnum> = computed((): SeverityEnum =>
        this.activity().status?.value === AvailabilityStatusEnum.AVAILABLE ? SeverityEnum.SUCCESS : SeverityEnum.INFO,
    )
}

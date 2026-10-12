import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ActivityModel } from '@shared/models/model/activity.model'

/**
 * Purpose: Tells which commands a activity of a list offers to the signed-in user and runs them.
 * Scope: Builds the action menu (movements history, edit, hide, show, delete) with its confirmations.
 * Limits: Holds no state; it only reads the session and calls the activity facade. The backend still checks every command.
 */
@Injectable()
export class ActivityActions extends ElementActionsBase<ActivityModel> {
    protected readonly translationPrefix: string = 'activities'
    protected override readonly primaryActionId: string = 'movements-history'

    private readonly facade: ActivityFacade = inject(ActivityFacade)
    private readonly router: Router = inject(Router)

    protected specsFor(activity: ActivityModel): ElementActionSpec[] {
        return [
            this.historySpec(activity),
            this.editSpec(activity),
            this.hideSpec(activity),
            this.showSpec(activity),
            this.deleteSpec(activity),
        ]
    }

    private historySpec(activity: ActivityModel): ElementActionSpec {
        return {
            id: 'movements-history',
            icon: 'clock-rotate-left',
            enabledAction: ElementActionEnum.ACTIVITY_CONSULT_MOVEMENTS,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_HISTORY_R),
            run: (): void => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES_MOVEMENTS, activity),
        }
    }

    private editSpec(activity: ActivityModel): ElementActionSpec {
        return {
            id: 'edit',
            icon: 'pen-to-square',
            enabledAction: ElementActionEnum.ACTIVITY_UPDATE,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U),
            run: (): void => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES_EDITION, activity),
        }
    }

    private hideSpec(activity: ActivityModel): ElementActionSpec {
        return {
            id: 'disable',
            icon: 'eye-slash',
            enabledAction: ElementActionEnum.ACTIVITY_DISABLE,
            shown: activity.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U),
            confirmation: { severity: SeverityEnum.WARNING, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.disableActivity(activity.id)) },
        }
    }

    private showSpec(activity: ActivityModel): ElementActionSpec {
        return {
            id: 'enable',
            icon: 'rotate-right',
            enabledAction: ElementActionEnum.ACTIVITY_ENABLE,
            shown: !activity.visible,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U),
            confirmation: { severity: SeverityEnum.INFO, icon: 'pi pi-info-circle', accept: (): void => this.run(this.facade.enableActivity(activity.id)) },
        }
    }

    private deleteSpec(activity: ActivityModel): ElementActionSpec {
        return {
            id: 'delete',
            icon: 'trash',
            enabledAction: ElementActionEnum.ACTIVITY_DELETE,
            shown: true,
            allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_D),
            confirmation: { severity: SeverityEnum.DANGER, icon: 'pi pi-exclamation-triangle', accept: (): void => this.run(this.facade.deleteActivity(activity)) },
        }
    }

    private navigate(route: RegistryRouteEnum, activity: ActivityModel): void {
        this.router.navigateByUrl(
            route.replace(':activityId', activity.id).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
        ).catch((err: Error) => console.error(err))
    }
}

import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base';
import { RouteHelper } from '@shared/helpers/route.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ActivityModel } from '@shared/models/model/activity.model';

/**
 * Objectif: Indique quelles commandes une activité d'une liste offre à l'utilisateur connecté et les exécute.
 * Périmètre: Construit le menu d'actions (historique des mouvements, modifier, supprimer, restaurer, supprimer définitivement) avec ses confirmations.
 * Limites: Ne détient aucun état ; lit seulement la session et appelle la facade des activités. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class ActivityActions extends ElementActionsBase<ActivityModel> {
	protected readonly translationPrefix: string = 'activities';
	protected override readonly primaryActionId: string = 'movements-history';

	private readonly facade = inject(ActivityFacade);
	private readonly router = inject(Router);

	protected specsFor(activity: ActivityModel): ElementActionSpec[] {
		return [
			this.historySpec(activity),
			this.editSpec(activity),
			this.softDeleteSpec(activity),
			this.restoreSpec(activity),
			this.hardDeleteSpec(activity),
		];
	}

	private historySpec(activity: ActivityModel): ElementActionSpec {
		return {
			id: 'movements-history',
			icon: 'clock-rotate-left',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_HISTORY_R),
			run: () => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES_MOVEMENTS, activity),
		};
	}

	private editSpec(activity: ActivityModel): ElementActionSpec {
		return {
			id: 'edit',
			icon: 'pen-to-square',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_U),
			run: () => this.navigate(RegistryRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES_EDITION, activity, true),
		};
	}

	private softDeleteSpec(activity: ActivityModel): ElementActionSpec {
		return {
			id: 'softDelete',
			icon: 'eye-slash',
			shown: activity.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_SOFT_DELETE),
			confirmation: {
				severity: SeverityEnum.WARNING,
				accept: () => this.run(this.facade.softDeleteActivity(activity.id)),
			},
		};
	}

	private restoreSpec(activity: ActivityModel): ElementActionSpec {
		return {
			id: 'restore',
			icon: 'rotate-right',
			shown: !activity.visible,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_RESTORE),
			confirmation: {
				severity: SeverityEnum.INFO,
				accept: () => this.run(this.facade.restoreActivity(activity.id)),
			},
		};
	}

	private hardDeleteSpec(activity: ActivityModel): ElementActionSpec {
		return {
			id: 'hardDelete',
			icon: 'trash',
			shown: true,
			allowed: this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_D),
			confirmation: {
				severity: SeverityEnum.DANGER,
				accept: () => this.run(this.facade.hardDeleteActivity(activity)),
			},
		};
	}

	private navigate(route: RegistryRouteEnum, activity: ActivityModel, keepQuery = false): void {
		const url = RouteHelper.withProjectId(
			route.replace(':activityId', activity.id),
			this.sessionFacade.currentProjectId(),
		);
		this.router
			.navigateByUrl(keepQuery ? RouteHelper.preservingQuery(url, this.router.url) : url)
			.catch((): void => undefined);
	}
}

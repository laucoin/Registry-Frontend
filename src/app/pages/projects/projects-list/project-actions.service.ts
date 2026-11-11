import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { tap } from 'rxjs';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base';
import { RouteHelper } from '@shared/helpers/route.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';
import { ProjectModel } from '@shared/models/model/project.model';

/**
 * Objectif: Indique quelles commandes un projet de la liste offre à l'utilisateur connecté et les exécute.
 * Périmètre: Construit le menu d'actions (modifier, supprimer, restaurer, supprimer définitivement avec saisie de confirmation) et les commandes de rejoindre et de profil de support d'un projet.
 * Limites: Ne détient aucun état ; lit seulement la session et appelle les facades des projets et des profils. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class ProjectActions extends ElementActionsBase<ProjectModel> {
	protected readonly translationPrefix: string = 'projects';

	private readonly facade = inject(ProjectFacade);
	private readonly userProfileFacade = inject(UserProfileFacade);
	private readonly router = inject(Router);
	private readonly destroyRef = inject(DestroyRef);

	public canJoin(project: ProjectModel): boolean {
		return CurrentUserHelper.hasAnyProjectAuthority(this.sessionFacade.currentUser(), project.id);
	}

	public canCreateSupport(project: ProjectModel): boolean {
		return (
			!this.canJoin(project) &&
			CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), UserAuthorityEnum.REGISTRY_PROFILE_C)
		);
	}

	public join(project: ProjectModel): void {
		this.navigate(RegistryRouteEnum.PROJECT, project);
	}

	public confirmSupportProfile(project: ProjectModel): void {
		this.confirmation.confirm('projects.actions.confirmations.create-support', project, SeverityEnum.WARNING, () =>
			this.createSupportProfile(project),
		);
	}

	protected specsFor(project: ProjectModel): ElementActionSpec[] {
		return [
			{
				id: 'edit',
				icon: 'pen-to-square',
				shown: true,
				allowed: this.allowedOn(project, ProjectAuthorityEnum.REGISTRY_PROJECT_U),
				run: () => this.navigate(RegistryRouteEnum.PROJECTS_EDITION, project),
			},
			this.softDeleteSpec(project),
			this.restoreSpec(project),
			this.hardDeleteSpec(project),
		];
	}

	private softDeleteSpec(project: ProjectModel): ElementActionSpec {
		return {
			id: 'softDelete',
			icon: 'eye-slash',
			shown: project.visible,
			allowed: this.allowedOn(project, ProjectAuthorityEnum.REGISTRY_PROJECT_SOFT_DELETE),
			confirmation: { severity: SeverityEnum.WARNING, accept: () => this.facade.softDeleteProject(project.id) },
		};
	}

	private restoreSpec(project: ProjectModel): ElementActionSpec {
		return {
			id: 'restore',
			icon: 'rotate-right',
			shown: !project.visible,
			allowed: this.allowedOn(project, ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE),
			confirmation: { severity: SeverityEnum.INFO, accept: () => this.facade.restoreProject(project.id) },
		};
	}

	private hardDeleteSpec(project: ProjectModel): ElementActionSpec {
		return {
			id: 'hardDelete',
			icon: 'trash',
			shown: true,
			allowed: this.allowedOn(project, ProjectAuthorityEnum.REGISTRY_PROJECT_D),
			confirmation: {
				severity: SeverityEnum.DANGER,
				accept: () => this.facade.hardDeleteProject(project),
				typed: true,
			},
		};
	}

	private allowedOn(project: ProjectModel, authority: ProjectAuthorityEnum): boolean {
		return CurrentUserHelper.hasProjectAuthority(this.sessionFacade.currentUser(), project.id, authority);
	}

	private navigate(route: RegistryRouteEnum, project: ProjectModel): void {
		this.router.navigateByUrl(RouteHelper.withProjectId(route, project.id)).catch((): void => undefined);
	}

	private createSupportProfile(project: ProjectModel): void {
		this.userProfileFacade
			.createSupportProjectProfile(project.id)
			.pipe(
				tap(() => this.join(project)),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe();
	}
}

import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { tap } from 'rxjs';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';
import { ElementActionModel } from '@shared/models/model/element-action.model';
import { ProjectModel } from '@shared/models/model/project.model';

interface ProjectActionBaseSpec {
	id: string;
	icon: string;
	authority: ProjectAuthorityEnum;
	shown: boolean;
}

type ProjectActionSpec = ProjectActionBaseSpec &
	(
		| { confirmation: { severity: SeverityEnum; accept: () => void }; run?: undefined }
		| { confirmation?: undefined; run: () => void }
	);

/**
 * Purpose: Indique quelles commandes un projet de la liste offre à l'utilisateur connecté et les exécute.
 * Scope: Construit le menu d'actions (modifier, supprimer, restaurer, supprimer définitivement) avec ses confirmations, et les commandes de rejoindre et de profil de support d'un projet.
 * Limits: Ne détient aucun état ; lit seulement la session et appelle les facades des projets et des profils. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class ProjectActions {
	private readonly facade = inject(ProjectFacade);
	private readonly userProfileFacade = inject(UserProfileFacade);
	private readonly sessionFacade = inject(SessionFacade);
	private readonly confirmation = inject(ElementConfirmationService);
	private readonly router = inject(Router);
	private readonly destroyRef = inject(DestroyRef);

	public actionsFor(project: ProjectModel): ElementActionModel[] {
		return this.specsFor(project)
			.filter((spec) => spec.shown)
			.map((spec) => this.toAction(project, spec));
	}

	public canJoin(project: ProjectModel): boolean {
		return this.hasAnyProjectAuthority(project);
	}

	public canCreateSupport(project: ProjectModel): boolean {
		return (
			!this.hasAnyProjectAuthority(project) &&
			CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), UserAuthorityEnum.REGISTRY_PROFILE_C)
		);
	}

	public join(project: ProjectModel): void {
		this.router
			.navigateByUrl(RegistryRouteEnum.PROJECT.replace(':projectId', project.id))
			.catch((): void => undefined);
	}

	public confirmSupportProfile(project: ProjectModel): void {
		this.confirm('projects.actions.confirmations.create-support', project, SeverityEnum.WARNING, () =>
			this.createSupportProfile(project),
		);
	}

	private specsFor(project: ProjectModel): ProjectActionSpec[] {
		return [
			this.editSpec(project),
			this.softDeleteSpec(project),
			this.restoreSpec(project),
			this.hardDeleteSpec(project),
		];
	}

	private editSpec(project: ProjectModel): ProjectActionSpec {
		return {
			id: 'edit',
			icon: 'pen-to-square',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_U,
			shown: true,
			run: () => this.edit(project),
		};
	}

	private softDeleteSpec(project: ProjectModel): ProjectActionSpec {
		return {
			id: 'softDelete',
			icon: 'eye-slash',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_SOFT_DELETE,
			shown: project.visible,
			confirmation: {
				severity: SeverityEnum.WARNING,
				accept: () => this.facade.softDeleteProject(project.id),
			},
		};
	}

	private restoreSpec(project: ProjectModel): ProjectActionSpec {
		return {
			id: 'restore',
			icon: 'rotate-right',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE,
			shown: !project.visible,
			confirmation: {
				severity: SeverityEnum.INFO,
				accept: () => this.facade.restoreProject(project.id),
			},
		};
	}

	private hardDeleteSpec(project: ProjectModel): ProjectActionSpec {
		return {
			id: 'hardDelete',
			icon: 'trash',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_D,
			shown: true,
			confirmation: {
				severity: SeverityEnum.DANGER,
				accept: () => this.facade.hardDeleteProject(project),
			},
		};
	}

	private toAction(project: ProjectModel, spec: ProjectActionSpec): ElementActionModel {
		const confirmation = spec.confirmation;
		return {
			id: spec.id,
			label: `projects.actions.${spec.id}`,
			icon: spec.icon,
			disabled: !CurrentUserHelper.hasProjectAuthority(
				this.sessionFacade.currentUser(),
				project.id,
				spec.authority,
			),
			danger: confirmation?.severity === SeverityEnum.DANGER,
			run: spec.confirmation ? () => this.confirmSpec(project, spec.id, spec.confirmation) : spec.run,
		};
	}

	private confirmSpec(
		project: ProjectModel,
		id: string,
		confirmation: NonNullable<ProjectActionSpec['confirmation']>,
	): void {
		this.confirm(`projects.actions.confirmations.${id}`, project, confirmation.severity, confirmation.accept);
	}

	private edit(project: ProjectModel): void {
		this.router
			.navigateByUrl(RegistryRouteEnum.PROJECTS_EDITION.replace(':projectId', project.id))
			.catch((): void => undefined);
	}

	private confirm(prefix: string, project: ProjectModel, severity: SeverityEnum, accept: () => void): void {
		this.confirmation.confirm(prefix, project, severity, accept);
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

	private hasAnyProjectAuthority(project: ProjectModel): boolean {
		return (
			this.sessionFacade
				.currentUser()
				?.authorities.some((authority) => authority.startsWith(`${project.id}_REGISTRY_PROJECT`)) ?? false
		);
	}
}

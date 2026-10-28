import { DestroyRef, inject, Injectable } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { ProjectModel } from '@shared/models/model/project.model'
import { tap } from 'rxjs'

interface ProjectActionSpec {
	id: string
	icon: string
	authority: ProjectAuthorityEnum
	shown: boolean
	confirmation?: { severity: SeverityEnum, accept: () => void }
	run?: () => void
}

/**
 * Purpose: Indique quelles commandes un projet de la liste offre à l'utilisateur connecté et les exécute.
 * Scope: Construit le menu d'actions (modifier, masquer, réafficher, supprimer) avec ses confirmations, et les commandes de rejoindre et de profil de support d'un projet.
 * Limits: Ne détient aucun état ; lit seulement la session et appelle les facades des projets et des profils. Le backend vérifie toujours chaque commande.
 */
@Injectable()
export class ProjectActions {
	private readonly facade: ProjectFacade = inject(ProjectFacade)
	private readonly userProfileFacade: UserProfileFacade = inject(UserProfileFacade)
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)
	private readonly confirmation: ElementConfirmationService = inject(ElementConfirmationService)
	private readonly router: Router = inject(Router)
	private readonly destroyRef: DestroyRef = inject(DestroyRef)

	public actionsFor(project: ProjectModel): ElementActionModel[] {
		return this.specsFor(project).filter((spec: ProjectActionSpec): boolean => spec.shown).map(
			(spec: ProjectActionSpec): ElementActionModel => this.toAction(project, spec),
		)
	}

	public canJoin(project: ProjectModel): boolean {
		return this.hasAnyProjectAuthority(project)
	}

	public canCreateSupport(project: ProjectModel): boolean {
		return !this.hasAnyProjectAuthority(project)
			&& CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), UserAuthorityEnum.REGISTRY_PROFILE_C)
	}

	public join(project: ProjectModel): void {
		this.router.navigateByUrl(RegistryRouteEnum.PROJECT.replace(':projectId', project.id))
			.catch((): void => undefined)
	}

	public confirmSupportProfile(project: ProjectModel): void {
		this.confirm('projects.actions.confirmations.create-support', project, SeverityEnum.WARNING, (): void => this.createSupportProfile(project))
	}

	private specsFor(project: ProjectModel): ProjectActionSpec[] {
		return [this.editSpec(project), this.disableSpec(project), this.enableSpec(project), this.deleteSpec(project)]
	}

	private editSpec(project: ProjectModel): ProjectActionSpec {
		return {
			id: 'edit',
			icon: 'pen-to-square',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_U,
			shown: true,
			run: (): void => this.edit(project),
		}
	}

	private disableSpec(project: ProjectModel): ProjectActionSpec {
		return {
			id: 'disable',
			icon: 'eye-slash',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_U,
			shown: project.visible,
			confirmation: {
				severity: SeverityEnum.WARNING,
				accept: (): void => this.facade.disableProject(project.id),
			},
		}
	}

	private enableSpec(project: ProjectModel): ProjectActionSpec {
		return {
			id: 'enable',
			icon: 'rotate-right',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_D,
			shown: !project.visible,
			confirmation: {
				severity: SeverityEnum.INFO,
				accept: (): void => this.facade.enableProject(project.id),
			},
		}
	}

	private deleteSpec(project: ProjectModel): ProjectActionSpec {
		return {
			id: 'delete',
			icon: 'trash',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_D,
			shown: true,
			confirmation: {
				severity: SeverityEnum.DANGER,
				accept: (): void => this.facade.deleteProject(project),
			},
		}
	}

	private toAction(project: ProjectModel, spec: ProjectActionSpec): ElementActionModel {
		const confirmation: ProjectActionSpec['confirmation'] = spec.confirmation
		return {
			id: spec.id,
			label: `projects.actions.${spec.id}`,
			icon: spec.icon,
			disabled: !CurrentUserHelper.hasProjectAuthority(this.sessionFacade.currentUser(), project.id, spec.authority),
			danger: confirmation?.severity === SeverityEnum.DANGER,
			run: confirmation
				? (): void => this.confirm(`projects.actions.confirmations.${spec.id}`, project, confirmation.severity, confirmation.accept)
				: spec.run!,
		}
	}

	private edit(project: ProjectModel): void {
		this.router.navigateByUrl(RegistryRouteEnum.PROJECTS_EDITION.replace(':projectId', project.id)).catch((): void => undefined)
	}

	private confirm(prefix: string, project: ProjectModel, severity: SeverityEnum, accept: () => void): void {
		this.confirmation.confirm(prefix, project, severity, accept)
	}

	private createSupportProfile(project: ProjectModel): void {
		this.userProfileFacade.createSupportProjectProfile(project.id).pipe(
			tap((): void => this.join(project)),
			takeUntilDestroyed(this.destroyRef),
		).subscribe()
	}

	private hasAnyProjectAuthority(project: ProjectModel): boolean {
		return this.sessionFacade.currentUser()?.authorities.some(
			(authority: string): boolean => authority.startsWith(`${project.id}_REGISTRY_PROJECT`),
		) ?? false
	}
}

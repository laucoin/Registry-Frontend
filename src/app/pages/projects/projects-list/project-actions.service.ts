import { DestroyRef, inject, Injectable } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { tap } from 'rxjs'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectActionModel } from '@pages/projects/projects-list/project-action.model'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { ProjectModel } from '@shared/models/model/project.model'

interface ProjectActionSpec {
    id: string
    icon: string
    authority: ProjectAuthorityEnum
    enabledAction: ElementActionEnum
    shown: boolean
    confirmation?: { severity: SeverityEnum, icon: string, accept: () => void }
    run?: () => void
}

/**
 * Purpose: Tells which commands a project of the list offers to the signed-in user and runs them.
 * Scope: Builds the action menu (edit, hide, show, delete) with its confirmations, and the join and support-profile commands of one project.
 * Limits: Holds no state; it only reads the session and calls the project and profile facades. The backend still checks every command.
 */
@Injectable()
export class ProjectActions {
    private readonly facade: ProjectFacade = inject(ProjectFacade)
    private readonly userProfileFacade: UserProfileFacade = inject(UserProfileFacade)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)
    private readonly uiFacade: UiFacade = inject(UiFacade)
    private readonly router: Router = inject(Router)
    private readonly translateService: TranslocoService = inject(TranslocoService)
    private readonly destroyRef: DestroyRef = inject(DestroyRef)

    public actionsFor(project: ProjectModel): ProjectActionModel[] {
        return this.specsFor(project).filter((spec: ProjectActionSpec): boolean => spec.shown && this.isEnabled(spec.enabledAction)).map(
            (spec: ProjectActionSpec): ProjectActionModel => this.toAction(project, spec),
        )
    }

    public canJoin(project: ProjectModel): boolean {
        return this.hasAnyProjectAuthority(project)
    }

    public canCreateSupport(project: ProjectModel): boolean {
        return !this.hasAnyProjectAuthority(project)
            && this.isEnabled(ElementActionEnum.PROJECT_CREATE_SUPPORT_PROFILE)
            && CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), UserAuthorityEnum.REGISTRY_PROFILE_C)
    }

    public join(project: ProjectModel): void {
        this.router.navigateByUrl(RegistryRouteEnum.PROJECT.replace(':projectId', project.id)).catch(console.error)
    }

    public confirmSupportProfile(project: ProjectModel): void {
        this.confirm('projects.actions.confirmations.create-support', project, SeverityEnum.WARNING, 'pi pi-exclamation-triangle', (): void => this.createSupportProfile(project))
    }

    private specsFor(project: ProjectModel): ProjectActionSpec[] {
        return [
            { id: 'edit', icon: 'pen-to-square', authority: ProjectAuthorityEnum.REGISTRY_PROJECT_U, enabledAction: ElementActionEnum.PROJECT_UPDATE, shown: true, run: (): void => this.edit(project) },
            { id: 'disable', icon: 'eye-slash', authority: ProjectAuthorityEnum.REGISTRY_PROJECT_U, enabledAction: ElementActionEnum.PROJECT_DISABLE, shown: project.visible, confirmation: { severity: SeverityEnum.WARNING, icon: 'pi pi-exclamation-triangle', accept: (): void => this.facade.disableProject(project.id) } },
            { id: 'enable', icon: 'rotate-right', authority: ProjectAuthorityEnum.REGISTRY_PROJECT_U, enabledAction: ElementActionEnum.PROJECT_ENABLE, shown: !project.visible, confirmation: { severity: SeverityEnum.INFO, icon: 'pi pi-info-circle', accept: (): void => this.facade.enableProject(project.id) } },
            { id: 'delete', icon: 'trash', authority: ProjectAuthorityEnum.REGISTRY_PROJECT_D, enabledAction: ElementActionEnum.PROJECT_DELETE, shown: true, confirmation: { severity: SeverityEnum.DANGER, icon: 'pi pi-exclamation-triangle', accept: (): void => this.facade.deleteProject(project) } },
        ]
    }

    private toAction(project: ProjectModel, spec: ProjectActionSpec): ProjectActionModel {
        const confirmation: ProjectActionSpec['confirmation'] = spec.confirmation
        return {
            id: spec.id,
            label: `projects.actions.${spec.id}`,
            icon: spec.icon,
            disabled: !CurrentUserHelper.hasProjectAuthority(this.sessionFacade.currentUser(), project.id, spec.authority),
            danger: confirmation?.severity === SeverityEnum.DANGER,
            run: confirmation
                ? (): void => this.confirm(`projects.actions.confirmations.${spec.id}`, project, confirmation.severity, confirmation.icon, confirmation.accept)
                : spec.run!,
        }
    }

    private edit(project: ProjectModel): void {
        this.router.navigateByUrl(RegistryRouteEnum.PROJECTS_EDITION.replace(':projectId', project.id)).catch(console.error)
    }

    private confirm(prefix: string, project: ProjectModel, severity: SeverityEnum, icon: string, accept: () => void): void {
        this.uiFacade.confirm({
            header: this.translateService.translate(`${prefix}.title`, { element: project }),
            message: this.translateService.translate(`${prefix}.message`, { element: project }),
            icon: icon,
            acceptSeverity: severity,
            accept: accept,
        })
    }

    private createSupportProfile(project: ProjectModel): void {
        this.userProfileFacade.createSupportProjectProfile(project.id).pipe(
            tap((): void => this.join(project)),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe()
    }

    private isEnabled(action: ElementActionEnum): boolean {
        return RegistryConfig.config.enabledActions.includes(action)
    }

    private hasAnyProjectAuthority(project: ProjectModel): boolean {
        return this.sessionFacade.currentUser()?.authorities.some(
            (authority: string): boolean => authority.startsWith(`${project.id}_REGISTRY_PROJECT`),
        ) ?? false
    }
}

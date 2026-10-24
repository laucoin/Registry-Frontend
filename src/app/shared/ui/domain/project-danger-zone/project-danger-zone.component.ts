import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import '@sgdf/ui/icon'
import '@sgdf/ui/table'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/table-row'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProjectModel } from '@shared/models/model/project.model'

const NAME_MAX_LENGTH: number = 50

/**
 * Purpose: Offers the irreversible or restrictive commands of the selected project: hide, show again and delete.
 * Scope: Shows each command the signed-in user may run, behind the same confirmations as the project list; the deletion asks to type a phrase.
 * Limits: Renders nothing when the user may run none of them; the backend still checks every command.
 */
@Component({
	imports: [TranslocoPipe],
	selector: 'app-project-danger-zone',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-configuration')],
	templateUrl: './project-danger-zone.component.html',
})
export class ProjectDangerZoneComponent {
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)
	private readonly projectFacade: ProjectFacade = inject(ProjectFacade)
	private readonly confirmation: ElementConfirmationService = inject(ElementConfirmationService)

	protected readonly project: Signal<ProjectModel | undefined> = this.sessionFacade.selectedProject

	protected readonly canDisable: Signal<boolean> = computed((): boolean =>
		(this.project()?.visible ?? false) && this.allowed(ProjectAuthorityEnum.REGISTRY_PROJECT_U))
	protected readonly canEnable: Signal<boolean> = computed((): boolean =>
		this.project()?.visible === false && this.allowed(ProjectAuthorityEnum.REGISTRY_PROJECT_D))
	protected readonly canDelete: Signal<boolean> = computed((): boolean =>
		this.allowed(ProjectAuthorityEnum.REGISTRY_PROJECT_D))
	protected readonly shown: Signal<boolean> = computed((): boolean => this.canDisable() || this.canEnable() || this.canDelete())

	protected disable(): void {
		this.ask('disable', SeverityEnum.WARNING, 'pi pi-exclamation-triangle', (project: ProjectModel): void => this.projectFacade.disableProject(project.id))
	}

	protected enable(): void {
		this.ask('enable', SeverityEnum.INFO, 'pi pi-info-circle', (project: ProjectModel): void => this.projectFacade.enableProject(project.id))
	}

	protected delete(): void {
		this.ask('delete', SeverityEnum.DANGER, 'pi pi-exclamation-triangle', (project: ProjectModel): void => this.projectFacade.deleteProject(project), true)
	}

	private ask(id: string, severity: SeverityEnum, icon: string, accept: (project: ProjectModel) => void, typed: boolean = false): void {
		const project: ProjectModel | undefined = this.project()
		if (!project) return
		this.confirmation.confirm(`projects.actions.confirmations.${id}`, { ...project, name: StringHelper.truncate(project.name, NAME_MAX_LENGTH, '…') }, severity, icon, (): void => accept(project), typed)
	}

	private allowed(authority: ProjectAuthorityEnum): boolean {
		return CurrentUserHelper.hasProjectAuthority(this.sessionFacade.currentUser(), this.sessionFacade.currentProjectId(), authority)
	}
}

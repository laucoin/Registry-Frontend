import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { StringHelper } from '@shared/helpers/string.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ProjectModel } from '@shared/models/model/project.model';

import '@sgdf/ui/button';
import '@sgdf/ui/callout';
import '@sgdf/ui/icon';
import '@sgdf/ui/table';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/table-row';

const NAME_MAX_LENGTH = 50;

/**
 * Purpose: Propose les commandes irréversibles ou restrictives du projet sélectionné : supprimer, restaurer et supprimer définitivement.
 * Scope: Affiche chaque commande que l'utilisateur connecté peut exécuter, derrière les mêmes confirmations que la liste des projets ; la suppression demande de saisir une phrase.
 * Limits: N'affiche rien quand l'utilisateur ne peut en exécuter aucune ; le backend vérifie toujours chaque commande.
 */
@Component({
	imports: [TranslocoPipe],
	selector: 'app-project-danger-zone',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-configuration')],
	templateUrl: './project-danger-zone.component.html',
})
export class ProjectDangerZoneComponent {
	private readonly sessionFacade = inject(SessionFacade);
	private readonly projectFacade = inject(ProjectFacade);
	private readonly confirmation = inject(ElementConfirmationService);

	protected readonly project = this.sessionFacade.selectedProject;

	protected readonly canSoftDelete = computed(
		() => (this.project()?.visible ?? false) && this.allowed(ProjectAuthorityEnum.REGISTRY_PROJECT_SOFT_DELETE),
	);
	protected readonly canRestore = computed(
		() => this.project()?.visible === false && this.allowed(ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE),
	);
	protected readonly canHardDelete = computed(() => this.allowed(ProjectAuthorityEnum.REGISTRY_PROJECT_D));
	protected readonly shown = computed(() => this.canSoftDelete() || this.canRestore() || this.canHardDelete());

	protected softDelete(): void {
		this.ask('softDelete', SeverityEnum.WARNING, (project) => this.projectFacade.softDeleteProject(project.id));
	}

	protected restore(): void {
		this.ask('restore', SeverityEnum.INFO, (project) => this.projectFacade.restoreProject(project.id));
	}

	protected hardDelete(): void {
		this.ask('hardDelete', SeverityEnum.DANGER, (project) => this.projectFacade.hardDeleteProject(project), true);
	}

	private ask(id: string, severity: SeverityEnum, accept: (project: ProjectModel) => void, typed = false): void {
		const project = this.project();
		if (!project) return;
		this.confirmation.confirm(
			`projects.actions.confirmations.${id}`,
			{ ...project, name: StringHelper.truncate(project.name, NAME_MAX_LENGTH, '…') },
			severity,
			() => accept(project),
			typed,
		);
	}

	private allowed(authority: ProjectAuthorityEnum): boolean {
		return CurrentUserHelper.hasProjectAuthority(
			this.sessionFacade.currentUser(),
			this.sessionFacade.currentProjectId(),
			authority,
		);
	}
}

import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import type { SgdfActionAppearance, SgdfStatusVariant } from '@sgdf/ui';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ProjectDangerCommandEnum } from '@shared/models/enumeration/project-danger-command.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ProjectModel } from '@shared/models/model/project.model';

import '@sgdf/ui/button';
import '@sgdf/ui/callout';
import '@sgdf/ui/icon';
import '@sgdf/ui/table';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/table-row';

const NAME_MAX_LENGTH = 50;

interface DangerCommand {
	id: ProjectDangerCommandEnum;
	variant: SgdfStatusVariant;
	buttonVariant: SgdfStatusVariant;
	buttonAppearance: SgdfActionAppearance;
	icon: string;
	severity: SeverityEnum;
	typed: boolean;
	available: (project: ProjectModel) => boolean;
	accept: (project: ProjectModel) => void;
}

/**
 * Objectif: Propose les commandes irréversibles ou restrictives du projet sélectionné : supprimer, restaurer et supprimer définitivement.
 * Périmètre: Affiche chaque commande que l'utilisateur connecté peut exécuter, derrière les mêmes confirmations que la liste des projets ; la suppression demande de saisir une phrase.
 * Limites: N'affiche rien quand l'utilisateur ne peut en exécuter aucune ; le backend vérifie toujours chaque commande.
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

	private readonly commands: DangerCommand[] = [
		{
			id: ProjectDangerCommandEnum.SOFT_DELETE,
			variant: 'warning',
			buttonVariant: 'warning',
			buttonAppearance: 'outlined',
			icon: 'eye-slash',
			severity: SeverityEnum.WARNING,
			typed: false,
			available: (project) => project.visible && this.allowed(ProjectAuthorityEnum.REGISTRY_PROJECT_SOFT_DELETE),
			accept: (project) => this.projectFacade.softDeleteProject(project.id),
		},
		{
			id: ProjectDangerCommandEnum.RESTORE,
			variant: 'info',
			buttonVariant: 'neutral',
			buttonAppearance: 'outlined',
			icon: 'rotate-right',
			severity: SeverityEnum.INFO,
			typed: false,
			available: (project) => !project.visible && this.allowed(ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE),
			accept: (project) => this.projectFacade.restoreProject(project.id),
		},
		{
			id: ProjectDangerCommandEnum.HARD_DELETE,
			variant: 'danger',
			buttonVariant: 'danger',
			buttonAppearance: 'solid',
			icon: 'trash',
			severity: SeverityEnum.DANGER,
			typed: true,
			available: () => this.allowed(ProjectAuthorityEnum.REGISTRY_PROJECT_D),
			accept: (project) => this.projectFacade.hardDeleteProject(project),
		},
	];

	protected readonly shownCommands: Signal<DangerCommand[]> = computed((): DangerCommand[] =>
		this.availableCommands(this.project()),
	);

	protected run(command: DangerCommand): void {
		const project = GenericHelper.require(this.project(), 'project');
		this.confirmation.confirm(
			`projects.actions.confirmations.${command.id}`,
			{ ...project, name: StringHelper.truncate(project.name, NAME_MAX_LENGTH, '…') },
			command.severity,
			() => command.accept(project),
			command.typed,
		);
	}

	private availableCommands(project: ProjectModel | undefined): DangerCommand[] {
		return project ? this.commands.filter((command) => command.available(project)) : [];
	}

	private allowed(authority: ProjectAuthorityEnum): boolean {
		return CurrentUserHelper.hasProjectAuthority(
			this.sessionFacade.currentUser(),
			this.sessionFacade.currentProjectId(),
			authority,
		);
	}
}

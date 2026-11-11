import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { ProjectActions } from '@pages/projects/projects-list/project-actions.service';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProjectModel } from '@shared/models/model/project.model';

import '@sgdf/ui/button';
import '@sgdf/ui/tag';

/**
 * Objectif: Fin de ligne d'un projet de la liste : visibilité, statut, options et accès au projet.
 * Périmètre: Affiche les étiquettes du projet, ouvre la liste de ses options quand il en a plusieurs, et propose de le
 * rejoindre ou d'y créer un profil de support, ou signale qu'il est masqué.
 * Limites: Les commandes sont déléguées à ProjectActions, fourni par la page ; les dialogues restent à la page.
 */
@Component({
	selector: 'app-project-row-status',
	host: { class: 'flex flex-wrap items-center gap-x-4 gap-y-2' },
	imports: [TranslocoPipe, PluralTranslationPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-row-status.component.html',
})
export class ProjectRowStatusComponent {
	protected readonly projectActions = inject(ProjectActions);

	public readonly project = input.required<ProjectModel>();
	public readonly optionsRequested = output();
	public readonly hiddenNoticeRequested = output();

	protected readonly options = computed(() => this.project().options ?? []);
	protected readonly available = computed(() => this.project().status?.value === AvailabilityStatusEnum.AVAILABLE);
}

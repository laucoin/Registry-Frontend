import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { RouteHelper } from '@shared/helpers/route.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';

import '@sgdf/ui/table';
import '@sgdf/ui/table-row';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/icon';
import '@sgdf/ui/tag';
import '@sgdf/ui/button';

/**
 * Purpose: Affiche l'identité du projet sélectionné : nom, période, statut et options.
 * Scope: Lit le projet sélectionné de la session et renvoie vers son édition quand l'utilisateur peut le modifier.
 * Limits: Lit uniquement la facade de session ; n'appelle jamais le backend.
 */
@Component({
	imports: [TranslocoPipe, DateFormatPipe, RouterLink],
	selector: 'app-project-information',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-information')],
	templateUrl: './project-information.component.html',
})
export class ProjectInformationComponent {
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly project = this.sessionFacade.selectedProject;
	protected readonly editUrl = computed(() =>
		RouteHelper.absolute(RegistryRouteEnum.PROJECTS_EDITION).replace(
			':projectId',
			this.sessionFacade.currentProjectId() ?? '',
		),
	);
	protected readonly canEdit = computed(() =>
		CurrentUserHelper.hasProjectAuthority(
			this.sessionFacade.currentUser(),
			this.sessionFacade.currentProjectId(),
			ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U,
		),
	);
	protected readonly optionLabels = computed(() =>
		(this.project()?.options ?? [])
			.map((option) => option.label ?? '')
			.filter(Boolean)
			.join(' · '),
	);
	protected readonly optionsRatio = computed(
		() => `${this.project()?.options?.length ?? 0}/${Object.keys(ProjectOptionEnum).length}`,
	);
}

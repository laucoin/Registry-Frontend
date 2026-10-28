import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/button'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { RouteHelper } from '@shared/helpers/route.helper'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { ProjectModel } from '@shared/models/model/project.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

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
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly project: Signal<ProjectModel | undefined> = this.sessionFacade.selectedProject
	protected readonly editUrl: Signal<string> = computed((): string =>
		RouteHelper.absolute(RegistryRouteEnum.PROJECTS_EDITION).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
	)
	protected readonly canEdit: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
		this.sessionFacade.currentUser(),
		this.sessionFacade.currentProjectId(),
		ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U,
	))
	protected readonly optionLabels: Signal<string> = computed((): string =>
		(this.project()?.options ?? []).map((option: SelectOptionModel<ProjectOptionEnum>): string => option.label ?? '').filter(Boolean).join(' · '),
	)
	protected readonly optionsRatio: Signal<string> = computed((): string =>
		`${this.project()?.options?.length ?? 0}/${Object.keys(ProjectOptionEnum).length}`,
	)
}

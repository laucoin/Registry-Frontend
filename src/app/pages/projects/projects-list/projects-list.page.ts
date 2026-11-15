import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal, signal, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ProjectActions } from '@pages/projects/projects-list/project-actions.service';
import { ProjectRowStatusComponent } from '@pages/projects/projects-list/project-row-status/project-row-status.component';
import {
	PROJECTS_SORT_FIELDS,
	ProjectsListSearchModel,
	toProjectsListSearchModel,
	toProjectsListSearchParams,
} from '@pages/projects/projects-list/projects-list.search';
import { ProjectsSearchFieldsComponent } from '@pages/projects/projects-list/projects-search-fields/projects-search-fields.component';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { RouteHelper } from '@shared/helpers/route.helper';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { FavoriteToggleComponent } from '@shared/ui/common/favorite-toggle/favorite-toggle.component';
import { InfoComponent } from '@shared/ui/common/info/info.component';
import { ListComponent } from '@shared/ui/common/list/list.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/button';
import '@sgdf/ui/dialog';
import '@sgdf/ui/icon';
import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/page-title';
import '@sgdf/ui/tag';

const INITIALS_LENGTH = 2;
const PROJECTS_LIST_DEFAULTS = toProjectsListSearchModel({
	q: undefined,
	at: undefined,
	isVisible: undefined,
	isFavorite: undefined,
	withProfile: true,
	sort: undefined,
});
const PROJECTS_LIST_QUERY_SCHEMA: SearchQuerySchema<ProjectsListSearchModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	at: SearchQueryFieldKindEnum.DATE,
	isVisible: SearchQueryFieldKindEnum.CHOICE,
	isFavorite: SearchQueryFieldKindEnum.CHOICE,
	withProfile: SearchQueryFieldKindEnum.CHOICE,
};

/**
 * Objectif: Page listant les projets que l'utilisateur peut voir, avec recherche et déclencheur « charger plus ».
 * Périmètre: Lie le composant de liste à la facade des projets, possède le formulaire de recherche et les projets affichés dans les dialogues d'options et de projets supprimés.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend ; les commandes sur un projet sont déléguées à ProjectActions.
 */
@Component({
	selector: 'app-projects-list',
	imports: [
		EllipsisDirective,
		ListComponent,
		RegistryTemplateDirective,
		InfoComponent,
		ElementActionsComponent,
		TranslocoPipe,
		RouterLink,
		CustomDateFormatPipe,
		FavoriteToggleComponent,
		ProjectsSearchFieldsComponent,
		ProjectRowStatusComponent,
	],
	providers: [ProjectActions],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	styles: ':host { display: block; width: 100%; }',
	templateUrl: './projects-list.page.html',
})
export class ProjectsListPage {
	protected readonly facade = inject(ProjectFacade);
	protected readonly projectActions = inject(ProjectActions);
	private readonly sessionFacade = inject(SessionFacade);
	private readonly autoRefresh = injectAutoRefresh('projects/list', RefreshKindEnum.COUNTS, () =>
		this.facade.refreshProjectsPage(),
	);

	protected readonly createRoute = RouteHelper.absolute(RegistryRouteEnum.PROJECTS_CREATION);
	protected readonly optionsProject: WritableSignal<ProjectModel | undefined> = signal(undefined);
	protected readonly hiddenProject: WritableSignal<ProjectModel | undefined> = signal(undefined);

	protected readonly canCreate = this.canWith(UserAuthorityEnum.REGISTRY_PROJECT_C);

	protected readonly canReadAll = this.canWith(UserAuthorityEnum.REGISTRY_PROJECT_R);

	protected readonly canSeeHidden = computed(() =>
		CurrentUserHelper.hasProjectAuthorityOnAnyProject(
			this.sessionFacade.currentUser(),
			ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE,
		),
	);

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.facade.projectsPageQueryParam()),
				this.facade.projectsPageAtParam() !== undefined,
				this.facade.projectsPageIsVisibleParam() !== undefined,
				this.facade.projectsPageIsFavoriteParam() !== undefined,
				this.canReadAll() && this.facade.projectsPageWithProfileParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly model = signal(PROJECTS_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: PROJECTS_LIST_QUERY_SCHEMA,
		defaults: PROJECTS_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<ProjectsListSearchModel>(PROJECTS_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.facade.fetchProjectsPage(undefined, undefined);
		},
	});

	protected search(model: ProjectsListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchProjectsPage(0, undefined);
		this.searchQuery.write(model);
	}

	private inputSearch(model: ProjectsListSearchModel): void {
		const search = toProjectsListSearchParams(model);
		this.facade.inputPageSearchParameters(
			search.q,
			search.at,
			search.isVisible,
			search.isFavorite,
			this.canReadAll() ? search.withProfile : undefined,
			search.sort,
		);
	}

	protected resetFilters(): void {
		this.model.set(PROJECTS_LIST_DEFAULTS);
		this.search();
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchProjectsPage(pageEvent.page, pageEvent.size);
	}

	protected toggleFavorite(project: ProjectModel): void {
		this.facade.toggleFavorite(project);
	}

	protected initials(project: ProjectModel): string {
		return StringHelper.initials(project.name, INITIALS_LENGTH);
	}

	protected closeDialog(event: Event, shown: WritableSignal<ProjectModel | undefined>): void {
		if (event.target === event.currentTarget) {
			shown.set(undefined);
		}
	}

	private canWith(authority: UserAuthorityEnum): Signal<boolean> {
		return computed(() => CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), authority));
	}
}

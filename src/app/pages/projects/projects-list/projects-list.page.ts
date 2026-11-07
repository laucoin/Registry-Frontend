import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ProjectRoutesEnum } from '@pages/projects/project-routes.enum';
import { ProjectActions } from '@pages/projects/projects-list/project-actions.service';
import {
	PROJECTS_SORT_FIELDS,
	ProjectsListSearchModel,
	toProjectsListSearchModel,
	toProjectsListSearchParams,
} from '@pages/projects/projects-list/projects-list.search';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { FavoriteToggleComponent } from '@shared/ui/common/favorite-toggle/favorite-toggle.component';
import { InfoComponent } from '@shared/ui/common/info/info.component';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/dialog';
import '@sgdf/ui/icon';
import '@sgdf/ui/input';
import '@sgdf/ui/option';
import '@sgdf/ui/page-title';
import '@sgdf/ui/select';
import '@sgdf/ui/switch';

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
	q: 'text',
	at: 'date',
	isVisible: 'choice',
	isFavorite: 'choice',
	withProfile: 'choice',
};

/**
 * Purpose: Page listant les projets que l'utilisateur peut voir, avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des projets, possède le formulaire de recherche et les projets affichés dans les dialogues d'options et de projets supprimés.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend ; les commandes sur un projet sont déléguées à ProjectActions.
 */
@Component({
	selector: 'app-projects-list',
	imports: [
		EllipsisDirective,
		ListComponent,
		RegistryTemplateDirective,
		SgdfFieldDirective,
		InfoComponent,
		ElementActionsComponent,
		TranslocoPipe,
		FormField,
		RouterLink,
		CustomDateFormatPipe,
		PluralTranslationPipe,
		BooleanChoicePipe,
		FavoriteToggleComponent,
		SortFieldsComponent,
	],
	providers: [ProjectActions],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	styleUrl: './projects-list.page.css',
	templateUrl: './projects-list.page.html',
})
export class ProjectsListPage {
	protected readonly facade = inject(ProjectFacade);
	protected readonly projectActions = inject(ProjectActions);
	private readonly sessionFacade = inject(SessionFacade);
	private readonly autoRefresh = injectAutoRefresh('projects/list', 'counts', () =>
		this.facade.refreshProjectsPage(),
	);

	protected readonly sortFields: readonly string[] = PROJECTS_SORT_FIELDS;
	protected readonly createRoute = ProjectRoutesEnum.CREATE;
	protected readonly optionsProject: WritableSignal<ProjectModel | undefined> = signal(undefined);
	protected readonly hiddenProject: WritableSignal<ProjectModel | undefined> = signal(undefined);

	protected readonly canCreate = this.canWith(UserAuthorityEnum.REGISTRY_PROJECT_C);

	protected readonly canReadAll = this.canWith(UserAuthorityEnum.REGISTRY_PROJECT_R);

	protected readonly canSeeHidden = computed(
		() =>
			this.sessionFacade
				.currentUser()
				?.authorities.some((authority) =>
					authority.endsWith(`_${ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE}`),
				) ?? false,
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
		const words = project.name.trim().split(/\s+/);
		const letters =
			words.length > 1
				? words
						.slice(0, INITIALS_LENGTH)
						.map((word) => Array.from(word)[0])
						.join('')
				: Array.from(words[0]).slice(0, INITIALS_LENGTH).join('');
		return letters.toUpperCase();
	}

	protected isAvailable(project: ProjectModel): boolean {
		return project.status?.value === AvailabilityStatusEnum.AVAILABLE;
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

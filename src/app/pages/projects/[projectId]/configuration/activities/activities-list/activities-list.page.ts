import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import {
	ACTIVITIES_LIST_SORT_FIELDS,
	ActivitiesListSearchModel,
	toActivitiesListSearchModel,
	toActivitiesListSearchParams,
} from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.search';
import { ActivitiesSearchFieldsComponent } from '@pages/projects/[projectId]/configuration/activities/activities-search-fields/activities-search-fields.component';
import { ActivityRoutesEnum } from '@pages/projects/[projectId]/configuration/activities/activity-routes.enum';
import { ActivityRowComponent } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-row.component';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';

import '@sgdf/ui/button';
import '@sgdf/ui/icon';
import '@sgdf/ui/page-title';

const ACTIVITIES_LIST_DEFAULTS = toActivitiesListSearchModel({
	q: undefined,
	at: undefined,
	isAvailable: undefined,
	isVisible: undefined,
	sort: undefined,
});
const ACTIVITIES_LIST_QUERY_SCHEMA: SearchQuerySchema<ActivitiesListSearchModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	at: SearchQueryFieldKindEnum.DATE,
	isAvailable: SearchQueryFieldKindEnum.CHOICE,
	isVisible: SearchQueryFieldKindEnum.CHOICE,
};

/**
 * Objectif: Page listant les activités du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Périmètre: Lie le composant de liste à la facade des activités, possède le formulaire de recherche et affiche chaque activité dans une ligne.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-activities-list',
	imports: [
		IfProjectAuthorityDirective,
		ListComponent,
		ActivityRowComponent,
		RegistryTemplateDirective,
		TranslocoPipe,
		RouterLink,
		RouterOutlet,
		ActivitiesSearchFieldsComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './activities-list.page.html',
})
export class ActivitiesListPage {
	protected readonly facade = inject(ActivityFacade);

	protected readonly createRoute: ActivityRoutesEnum = ActivityRoutesEnum.CREATE;

	protected readonly createAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_C;

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.facade.activitiesPageQueryParam()),
				this.facade.activitiesPageAtParam() !== undefined,
				this.facade.activitiesPageIsAvailableParam() !== undefined,
				this.facade.activitiesPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly model = signal(ACTIVITIES_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: ACTIVITIES_LIST_QUERY_SCHEMA,
		defaults: ACTIVITIES_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<ActivitiesListSearchModel>(ACTIVITIES_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.facade.fetchActivitiesPage(undefined, undefined);
		},
	});

	protected search(model: ActivitiesListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchActivitiesPage(0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(ACTIVITIES_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: ActivitiesListSearchModel): void {
		const search = toActivitiesListSearchParams(model);
		this.facade.inputPageSearchParameters(search.q, search.at, search.isAvailable, search.isVisible, search.sort);
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchActivitiesPage(pageEvent.page, pageEvent.size);
	}
}

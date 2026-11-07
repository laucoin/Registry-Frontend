import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { RouterLink, RouterOutlet } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import {
	ACTIVITIES_LIST_SORT_FIELDS,
	ActivitiesListSearchModel,
	toActivitiesListSearchModel,
	toActivitiesListSearchParams,
} from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.search';
import { ActivityRoutesEnum } from '@pages/projects/[projectId]/configuration/activities/activity-routes.enum';
import { ActivityRowComponent } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-row.component';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';

import '@sgdf/ui/button';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/icon';
import '@sgdf/ui/input';
import '@sgdf/ui/option';
import '@sgdf/ui/page-title';
import '@sgdf/ui/select';

const ACTIVITIES_LIST_DEFAULTS = toActivitiesListSearchModel({
	q: undefined,
	at: undefined,
	isAvailable: undefined,
	isVisible: undefined,
	sort: undefined,
});
const ACTIVITIES_LIST_QUERY_SCHEMA: SearchQuerySchema<ActivitiesListSearchModel> = {
	q: 'text',
	at: 'date',
	isAvailable: 'choice',
	isVisible: 'choice',
};

/**
 * Purpose: Page listant les activités du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des groupes, possède le formulaire de recherche et donne à la liste le template de ligne d'une activité.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-activities-list',
	imports: [
		SortFieldsComponent,
		IfProjectAuthorityDirective,
		ListComponent,
		ActivityRowComponent,
		RegistryTemplateDirective,
		SgdfFieldDirective,
		TranslocoPipe,
		FormField,
		RouterLink,
		RouterOutlet,
		BooleanChoicePipe,
		NgTemplateOutlet,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './activities-list.page.html',
})
export class ActivitiesListPage {
	protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_RESTORE;

	protected readonly facade = inject(ActivityFacade);
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly createRoute: ActivityRoutesEnum = ActivityRoutesEnum.CREATE;

	protected readonly canCreate = computed(() =>
		CurrentUserHelper.hasProjectAuthority(
			this.sessionFacade.currentUser(),
			this.facade.selectedProjectId(),
			ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_C,
		),
	);

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.facade.activitiesPageQueryParam()),
				this.facade.activitiesPageAtParam() !== undefined,
				this.facade.activitiesPageIsAvailableParam() !== undefined,
				this.facade.activitiesPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = ACTIVITIES_LIST_SORT_FIELDS;
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

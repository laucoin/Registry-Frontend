import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { ProjectProfileRoutesEnum } from '@pages/projects/[projectId]/configuration/profiles/project-profile-routes.enum';
import { ProjectProfileRowComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-row.component';
import {
	PROJECT_PROFILES_LIST_SORT_FIELDS,
	ProjectProfilesListSearchModel,
	toProjectProfilesListSearchModel,
	toProjectProfilesListSearchParams,
} from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.search';
import { ProjectProfilesSearchFieldsComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-search-fields/project-profiles-search-fields.component';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';

import '@sgdf/ui/button';
import '@sgdf/ui/icon';
import '@sgdf/ui/page-title';

const PROJECT_PROFILES_LIST_DEFAULTS = toProjectProfilesListSearchModel({
	q: undefined,
	at: undefined,
	status: undefined,
	isAvailable: undefined,
	isVisible: undefined,
	sort: undefined,
});
const PROJECT_PROFILES_LIST_QUERY_SCHEMA: SearchQuerySchema<ProjectProfilesListSearchModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	at: SearchQueryFieldKindEnum.DATE,
	status: SearchQueryFieldKindEnum.TEXT,
	isAvailable: SearchQueryFieldKindEnum.CHOICE,
	isVisible: SearchQueryFieldKindEnum.CHOICE,
};

/**
 * Objectif: Page listant les profils de projet du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Périmètre: Lie le composant de liste à la facade des profils de projet, possède le formulaire de recherche et affiche chaque profil dans une ligne.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-project-profiles-list',
	imports: [
		ListComponent,
		IfProjectAuthorityDirective,
		ProjectProfileRowComponent,
		RegistryTemplateDirective,
		TranslocoPipe,
		RouterLink,
		RouterOutlet,
		ProjectProfilesSearchFieldsComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-profiles-list.page.html',
})
export class ProjectProfilesListPage {
	protected readonly facade = inject(ProjectProfileFacade);

	protected readonly inviteRoute: ProjectProfileRoutesEnum = ProjectProfileRoutesEnum.INVITE;

	protected readonly inviteAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_C;

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.facade.projectProfilesPageQueryParam()),
				this.facade.projectProfilesPageAtParam() !== undefined,
				this.facade.projectProfilesPageStatusParam() !== undefined,
				this.facade.projectProfilesPageIsAvailableParam() !== undefined,
				this.facade.projectProfilesPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly model = signal(PROJECT_PROFILES_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: PROJECT_PROFILES_LIST_QUERY_SCHEMA,
		defaults: PROJECT_PROFILES_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<ProjectProfilesListSearchModel>(PROJECT_PROFILES_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.facade.fetchProjectProfilesPage(undefined, undefined);
		},
	});

	protected search(model: ProjectProfilesListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchProjectProfilesPage(0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(PROJECT_PROFILES_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: ProjectProfilesListSearchModel): void {
		const search = toProjectProfilesListSearchParams(model);
		this.facade.inputPageSearchParameters(
			search.q,
			search.at,
			search.status as ProfileStatusEnum | undefined,
			search.isAvailable,
			search.isVisible,
			search.sort,
		);
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchProjectProfilesPage(pageEvent.page, pageEvent.size);
	}
}

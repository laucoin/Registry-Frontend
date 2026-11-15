import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import {
	INVITATIONS_LIST_SORT_FIELDS,
	InvitationsListSearchModel,
	toInvitationsListSearchModel,
	toInvitationsListSearchParams,
} from '@pages/my-account/invitations/invitations-list.search';
import { ProjectProfileRowComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-row.component';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { RouteHelper } from '@shared/helpers/route.helper';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';

import '@sgdf/ui/button';
import '@sgdf/ui/callout';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/icon';
import '@sgdf/ui/input';
import '@sgdf/ui/page-title';

const INVITATIONS_LIST_DEFAULTS = toInvitationsListSearchModel({
	q: undefined,
	at: undefined,
	sort: undefined,
});
const INVITATIONS_LIST_QUERY_SCHEMA: SearchQuerySchema<InvitationsListSearchModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	at: SearchQueryFieldKindEnum.DATE,
};

/**
 * Objectif: Page listant les invitations de l'utilisateur connecté avec recherche et déclencheur « charger plus ».
 * Périmètre: Lie le composant de liste à la facade des profils utilisateur, possède le formulaire de recherche et donne à la liste le template de ligne d'un profil de projet.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-invitations-list',
	imports: [
		SortFieldsComponent,
		ListComponent,
		ProjectProfileRowComponent,
		RegistryTemplateDirective,
		SgdfFieldDirective,
		TranslocoPipe,
		FormField,
		RouterLink,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './invitations-list.page.html',
	styles: ':host { display: block; width: 100%; }',
})
export class InvitationsListPage {
	protected readonly userProfileFacade = inject(UserProfileFacade);

	protected readonly createRoute = RouteHelper.absolute(RegistryRouteEnum.PROJECTS_CREATION);
	protected readonly projectsRoute = RouteHelper.absolute(RegistryRouteEnum.PROJECTS);

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.userProfileFacade.userProjectProfileInvitationsPageQueryParam()),
				this.userProfileFacade.userProjectProfileInvitationsPageAtParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = INVITATIONS_LIST_SORT_FIELDS;
	protected readonly model = signal(INVITATIONS_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: INVITATIONS_LIST_QUERY_SCHEMA,
		defaults: INVITATIONS_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<InvitationsListSearchModel>(INVITATIONS_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.userProfileFacade.fetchProjectProfileInvitationPage(undefined, undefined);
		},
	});

	protected search(model: InvitationsListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.userProfileFacade.fetchProjectProfileInvitationPage(0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(INVITATIONS_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: InvitationsListSearchModel): void {
		const search = toInvitationsListSearchParams(model);
		this.userProfileFacade.inputInvitationsPageSearchParameters(search.q, search.at, search.sort);
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.userProfileFacade.fetchProjectProfileInvitationPage(pageEvent.page, pageEvent.size);
	}
}

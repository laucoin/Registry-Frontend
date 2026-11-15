import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { RouterOutlet } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { UserFacade } from '@pages/users/data/state/user.facade';
import { UserActions } from '@pages/users/users-list/user-actions.service';
import {
	toUsersListSearchModel,
	toUsersListSearchParams,
	USERS_LIST_SORT_FIELDS,
	UsersListSearchModel,
} from '@pages/users/users-list/users-list.search';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { VisibilityNamePipe } from '@shared/helpers/pipe/visibility.pipe';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { UserHelper } from '@shared/helpers/user.helper';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/button';
import '@sgdf/ui/copy-button';
import '@sgdf/ui/icon';
import '@sgdf/ui/input';
import '@sgdf/ui/list-item';
import '@sgdf/ui/option';
import '@sgdf/ui/page-title';
import '@sgdf/ui/relative-time';
import '@sgdf/ui/select';
import '@sgdf/ui/tag';

const USERS_LIST_DEFAULTS = toUsersListSearchModel({
	q: undefined,
	isVisible: undefined,
	sort: undefined,
});
const USERS_LIST_QUERY_SCHEMA: SearchQuerySchema<UsersListSearchModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	isVisible: SearchQueryFieldKindEnum.CHOICE,
};

/**
 * Objectif: Page listant les utilisateurs avec recherche et déclencheur « charger plus ».
 * Périmètre: Lie le composant de liste à la facade des utilisateurs et possède le formulaire de recherche ; les commandes sur un utilisateur sont déléguées à UserActions.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-users-list',
	imports: [
		SortFieldsComponent,
		EllipsisDirective,
		ListComponent,
		RegistryTemplateDirective,
		SgdfFieldDirective,
		ElementActionsComponent,
		TranslocoPipe,
		FormField,
		BooleanChoicePipe,
		VisibilityNamePipe,
		RouterOutlet,
	],
	providers: [UserActions],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './users-list.page.html',
	styles: ':host { display: block; width: 100%; }',
})
export class UsersListPage {
	protected readonly facade = inject(UserFacade);
	protected readonly userActions = inject(UserActions);

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.facade.usersPageQueryParam()),
				this.facade.actualUsersPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = USERS_LIST_SORT_FIELDS;
	protected readonly model = signal(USERS_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: USERS_LIST_QUERY_SCHEMA,
		defaults: USERS_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<UsersListSearchModel>(USERS_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.facade.fetchUsersPage(undefined, undefined);
		},
	});

	protected search(model: UsersListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchUsersPage(0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(USERS_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: UsersListSearchModel): void {
		const search = toUsersListSearchParams(model);
		this.facade.inputPageSearchParameters(search.q, search.isVisible, search.sort);
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchUsersPage(pageEvent.page, pageEvent.size);
	}

	protected readonly fullName = UserHelper.fullName;
	protected readonly initials = UserHelper.initials;
}

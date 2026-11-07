import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { MovementRoutesEnum } from '@pages/projects/[projectId]/movements/movement-routes.enum';
import {
	MOVEMENTS_LIST_SORT_FIELDS,
	MovementsListSearchModel,
	toMovementsListSearchModel,
	toMovementsListSearchParams,
} from '@pages/projects/[projectId]/movements/movements-list/movements-list.search';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component';

import '@sgdf/ui/button';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/icon';
import '@sgdf/ui/list-item';
import '@sgdf/ui/option';
import '@sgdf/ui/page-title';
import '@sgdf/ui/select';

const MOVEMENTS_LIST_DEFAULTS = toMovementsListSearchModel({
	type: undefined,
	from: undefined,
	to: undefined,
	isVisible: undefined,
	sort: undefined,
});
const MOVEMENTS_LIST_QUERY_SCHEMA: SearchQuerySchema<MovementsListSearchModel> = {
	type: 'text',
	from: 'date',
	to: 'date',
	isVisible: 'choice',
};

/**
 * Purpose: Page listant les mouvements du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des mouvements et possède le formulaire de recherche ; chaque ligne est un élément de mouvement.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-movements-list',
	imports: [
		SortFieldsComponent,
		IfProjectAuthorityDirective,
		ListComponent,
		MovementElementComponent,
		RegistryTemplateDirective,
		SgdfFieldDirective,
		BooleanChoicePipe,
		TranslocoPipe,
		FormField,
		RouterLink,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './movements-list.page.html',
})
export class MovementsListPage {
	protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_RESTORE;

	protected readonly facade = inject(MovementFacade);
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly createRegisteredRoute: MovementRoutesEnum = MovementRoutesEnum.CREATE_REGISTERED;
	protected readonly createGuestRoute: MovementRoutesEnum = MovementRoutesEnum.CREATE_GUEST;

	protected readonly canCreate = computed(() =>
		CurrentUserHelper.hasProjectAuthority(
			this.sessionFacade.currentUser(),
			this.facade.selectedProjectId(),
			ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C,
		),
	);

	protected readonly activeFilters = computed(
		() =>
			[
				this.facade.movementsPageTypeParam() !== undefined,
				this.facade.movementsPageFromParam() !== undefined,
				this.facade.movementsPageToParam() !== undefined,
				this.facade.movementsPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = MOVEMENTS_LIST_SORT_FIELDS;
	protected readonly model = signal(MOVEMENTS_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: MOVEMENTS_LIST_QUERY_SCHEMA,
		defaults: MOVEMENTS_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<MovementsListSearchModel>(MOVEMENTS_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.facade.fetchMovementsPage(undefined, undefined);
		},
	});

	protected search(model: MovementsListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchMovementsPage(0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(MOVEMENTS_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: MovementsListSearchModel): void {
		const search = toMovementsListSearchParams(model);
		this.facade.inputPageSearchParameters(search.type, search.from, search.to, search.isVisible, search.sort);
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchMovementsPage(pageEvent.page, pageEvent.size);
	}
}

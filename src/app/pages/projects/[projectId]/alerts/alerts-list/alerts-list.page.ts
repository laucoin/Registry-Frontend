import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import {
	ALERTS_LIST_SORT_FIELDS,
	AlertsListSearchModel,
	toAlertsListSearchModel,
	toAlertsListSearchParams,
} from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.search';
import { AlertsSearchFieldsComponent } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-search-fields/alerts-search-fields.component';
import { AlertsStatisticsComponent } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-statistics/alerts-statistics.component';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { AlertElementComponent } from '@shared/ui/domain/alert-element/alert-element.component';

import '@sgdf/ui/list-item';
import '@sgdf/ui/page-title';

const ALERTS_LIST_DEFAULTS = toAlertsListSearchModel({
	q: undefined,
	status: undefined,
	isVisible: undefined,
	from: undefined,
	to: undefined,
	sort: undefined,
});
const ALERTS_LIST_QUERY_SCHEMA: SearchQuerySchema<AlertsListSearchModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	status: SearchQueryFieldKindEnum.TEXT,
	isVisible: SearchQueryFieldKindEnum.CHOICE,
	from: SearchQueryFieldKindEnum.DATE,
	to: SearchQueryFieldKindEnum.DATE,
};

/**
 * Objectif: Page listant les alertes du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Périmètre: Lie le composant de liste à la facade des alertes et possède le formulaire de recherche ; chaque ligne est un élément d'alerte. Affiche au-dessus les statistiques des alertes.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-alerts-list',
	imports: [
		ListComponent,
		AlertElementComponent,
		AlertsSearchFieldsComponent,
		AlertsStatisticsComponent,
		RegistryTemplateDirective,
		TranslocoPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './alerts-list.page.html',
})
export class AlertsListPage {
	protected readonly facade = inject(AlertFacade);

	protected readonly activeFilters = computed(
		() =>
			[
				this.facade.alertsPageQueryParam() !== undefined,
				this.facade.alertsPageStatusParam() !== undefined,
				this.facade.alertsPageIsVisibleParam() !== undefined,
				this.facade.alertsPageFromParam() !== undefined,
				this.facade.alertsPageToParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly model = signal(ALERTS_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: ALERTS_LIST_QUERY_SCHEMA,
		defaults: ALERTS_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<AlertsListSearchModel>(ALERTS_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.facade.fetchAlertsPage(undefined, undefined);
		},
	});

	protected search(model: AlertsListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchAlertsPage(0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(ALERTS_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: AlertsListSearchModel): void {
		const search = toAlertsListSearchParams(model);
		this.facade.inputPageSearchParameters(
			search.q,
			search.status,
			search.isVisible,
			search.from,
			search.to,
			search.sort,
		);
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchAlertsPage(pageEvent.page, pageEvent.size);
	}
}

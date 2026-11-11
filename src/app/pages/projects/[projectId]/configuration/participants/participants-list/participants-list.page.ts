import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantGroupsDialogComponent } from '@pages/projects/[projectId]/configuration/participants/participant-groups-dialog/participant-groups-dialog.component';
import { ParticipantRoutesEnum } from '@pages/projects/[projectId]/configuration/participants/participant-routes.enum';
import { ParticipantRowComponent } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-row.component';
import {
	PARTICIPANTS_LIST_SORT_FIELDS,
	ParticipantsListSearchModel,
	toParticipantsListSearchModel,
	toParticipantsListSearchParams,
} from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.search';
import { ParticipantsSearchFieldsComponent } from '@pages/projects/[projectId]/configuration/participants/participants-search-fields/participants-search-fields.component';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ListComponent } from '@shared/ui/common/list/list.component';

import '@sgdf/ui/button';
import '@sgdf/ui/icon';
import '@sgdf/ui/page-title';

const PARTICIPANTS_LIST_DEFAULTS = toParticipantsListSearchModel({
	q: undefined,
	status: undefined,
	isVisible: undefined,
	sort: undefined,
});
const PARTICIPANTS_LIST_QUERY_SCHEMA: SearchQuerySchema<ParticipantsListSearchModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	status: SearchQueryFieldKindEnum.TEXT,
	isVisible: SearchQueryFieldKindEnum.CHOICE,
};

/**
 * Objectif: Page listant les participants du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Périmètre: Lie le composant de liste à la facade des participants, possède le formulaire de recherche, affiche chaque participant dans une ligne et tous ses groupes dans un dialogue.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-participants-list',
	imports: [
		IfProjectAuthorityDirective,
		ListComponent,
		ParticipantRowComponent,
		RegistryTemplateDirective,
		TranslocoPipe,
		RouterLink,
		ParticipantsSearchFieldsComponent,
		ParticipantGroupsDialogComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participants-list.page.html',
})
export class ParticipantsListPage {
	protected readonly hiddenAuthority: ProjectAuthorityEnum =
		ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_RESTORE;

	protected readonly facade = inject(ParticipantFacade);

	protected readonly createRoute: ParticipantRoutesEnum = ParticipantRoutesEnum.CREATE;

	protected readonly createAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_C;

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.facade.participantsPageQueryParam()),
				this.facade.participantsPageStatusParam() !== undefined,
				this.facade.participantsPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = PARTICIPANTS_LIST_SORT_FIELDS;
	protected readonly groupsOf = signal<ParticipantModel | undefined>(undefined);
	protected readonly model = signal(PARTICIPANTS_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: PARTICIPANTS_LIST_QUERY_SCHEMA,
		defaults: PARTICIPANTS_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<ParticipantsListSearchModel>(PARTICIPANTS_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.facade.fetchParticipantsPage(undefined, undefined);
		},
	});

	protected search(model: ParticipantsListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchParticipantsPage(0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(PARTICIPANTS_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: ParticipantsListSearchModel): void {
		const search = toParticipantsListSearchParams(model);
		this.facade.inputPageSearchParameters(search.q, search.status, search.isVisible, search.sort);
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchParticipantsPage(pageEvent.page, pageEvent.size);
	}
}

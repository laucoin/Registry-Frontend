import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantRoutesEnum } from '@pages/projects/[projectId]/configuration/participants/participant-routes.enum';
import { ParticipantRowComponent } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-row.component';
import {
	PARTICIPANTS_LIST_SORT_FIELDS,
	ParticipantsListSearchModel,
	toParticipantsListSearchModel,
	toParticipantsListSearchParams,
} from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.search';
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
import '@sgdf/ui/icon';
import '@sgdf/ui/input';
import '@sgdf/ui/option';
import '@sgdf/ui/page-title';
import '@sgdf/ui/select';

const PARTICIPANTS_LIST_DEFAULTS = toParticipantsListSearchModel({
	q: undefined,
	status: undefined,
	isVisible: undefined,
	sort: undefined,
});
const PARTICIPANTS_LIST_QUERY_SCHEMA: SearchQuerySchema<ParticipantsListSearchModel> = {
	q: 'text',
	status: 'text',
	isVisible: 'choice',
};

/**
 * Purpose: Page listant les participants du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des participants, possède le formulaire de recherche et donne à la liste le template de ligne d'un participant.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-participants-list',
	imports: [
		SortFieldsComponent,
		IfProjectAuthorityDirective,
		ListComponent,
		ParticipantRowComponent,
		RegistryTemplateDirective,
		SgdfFieldDirective,
		TranslocoPipe,
		FormField,
		RouterLink,
		BooleanChoicePipe,
		NgTemplateOutlet,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participants-list.page.html',
})
export class ParticipantsListPage {
	protected readonly hiddenAuthority: ProjectAuthorityEnum =
		ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_RESTORE;

	protected readonly facade = inject(ParticipantFacade);
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly createRoute: ParticipantRoutesEnum = ParticipantRoutesEnum.CREATE;

	protected readonly canCreate = computed(() =>
		CurrentUserHelper.hasProjectAuthority(
			this.sessionFacade.currentUser(),
			this.facade.selectedProjectId(),
			ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_C,
		),
	);

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.facade.participantsPageQueryParam()),
				this.facade.participantsPageStatusParam() !== undefined,
				this.facade.participantsPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = PARTICIPANTS_LIST_SORT_FIELDS;
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

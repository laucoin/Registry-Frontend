import { NgTemplateOutlet } from '@angular/common';
import {
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	inject,
	model,
	signal,
	WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';
import { Observable, switchMap, tap } from 'rxjs';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import {
	createAddMembersForm,
	emptyAddMembersFormModel,
	toMemberIds,
} from '@pages/projects/[projectId]/configuration/groups/group-member-list/add-members.form';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantFormComponent } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component';
import { ParticipantRowComponent } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-row.component';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { EventHelper } from '@shared/helpers/event.helper';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { withLoading } from '@shared/helpers/rx.helper';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { GroupModel } from '@shared/models/model/group.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';
import { GroupMembersFieldComponent } from '@shared/ui/domain/group-members-field/group-members-field.component';

import {
	GROUP_MEMBER_LIST_SORT_FIELDS,
	GroupMemberListSearchModel,
	toGroupMemberListSearchModel,
	toGroupMemberListSearchParams,
} from './group-member-list.search';

import '@sgdf/ui/button';
import '@sgdf/ui/drawer';
import '@sgdf/ui/icon';
import '@sgdf/ui/input';
import '@sgdf/ui/option';
import '@sgdf/ui/page-title';
import '@sgdf/ui/select';
import '@sgdf/ui/skeleton';

const GROUP_MEMBER_LIST_DEFAULTS = toGroupMemberListSearchModel({
	q: undefined,
	status: undefined,
	isVisible: undefined,
	sort: undefined,
});
const GROUP_MEMBER_LIST_QUERY_SCHEMA: SearchQuerySchema<GroupMemberListSearchModel> = {
	q: 'text',
	status: 'text',
	isVisible: 'choice',
};

/**
 * Purpose: Page listant les membres d'un groupe avec recherche et déclencheur « charger plus », et les formulaires d'ajout ou de création de membres.
 * Scope: Lie le composant de liste à la facade des groupes, possède le formulaire de recherche, donne à la liste le template de ligne d'un participant et ouvre les couches d'ajout et de création de membres.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-group-member-list',
	imports: [
		SortFieldsComponent,
		IfProjectAuthorityDirective,
		ListComponent,
		ParticipantRowComponent,
		RegistryTemplateDirective,
		SgdfFieldDirective,
		BooleanChoicePipe,
		NgTemplateOutlet,
		FormField,
		TranslocoPipe,
		GroupMembersFieldComponent,
		FormActionsComponent,
		ParticipantFormComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './group-member-list.page.html',
})
export class GroupMemberListPage {
	protected readonly hiddenAuthority: ProjectAuthorityEnum =
		ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_RESTORE;

	private readonly destroyRef = inject(DestroyRef);
	protected readonly facade = inject(GroupFacade);
	protected readonly participantFacade = inject(ParticipantFacade);
	private readonly route = inject(ActivatedRoute);
	private readonly sessionFacade = inject(SessionFacade);
	protected readonly uiFacade = inject(UiFacade);

	protected readonly group: WritableSignal<GroupModel | undefined> = signal(undefined);
	protected readonly groupLoading = signal(false);

	protected readonly addMembersModel = signal(emptyAddMembersFormModel());
	protected readonly addMembersForm = createAddMembersForm(this.addMembersModel);
	protected readonly addMembersFormLayerOpened = model<boolean>(false);

	protected readonly createMemberFormLayerOpened = model<boolean>(false);

	protected readonly canAddMembers = computed(() =>
		this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U),
	);
	protected readonly canCreateMember = computed(
		() =>
			this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_C) &&
			this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U),
	);

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.facade.groupMembersPageQueryParam()),
				this.facade.groupMembersPageStatusParam() !== undefined,
				this.facade.groupMembersPageIsVisibleParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly sortFields: readonly string[] = GROUP_MEMBER_LIST_SORT_FIELDS;
	protected readonly model = signal(GROUP_MEMBER_LIST_DEFAULTS);
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: GROUP_MEMBER_LIST_QUERY_SCHEMA,
		defaults: GROUP_MEMBER_LIST_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<GroupMemberListSearchModel>(GROUP_MEMBER_LIST_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model) => {
			this.inputSearch(model);
			this.facade.fetchGroupMembersPage(this.groupId(), undefined, undefined);
		},
	});

	constructor() {
		this.loadData();
		this.handleParticipantActions();
	}

	protected loadData(): void {
		this.facade
			.fetchGroup(this.groupId())
			.pipe(withLoading(this.groupLoading))
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((group) => this.group.set(group));
	}

	private handleParticipantActions(): void {
		this.facade
			.handleGroupMembersChange()
			.pipe(switchMap(() => this.facade.fetchGroup(this.groupId())))
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((group) => this.group.set(group));
		this.reloadMembersOn(this.participantFacade.handleParticipantFirstPageReload(), () =>
			this.facade.fetchGroupMembersPage(this.groupId(), 0, undefined),
		);
		this.reloadMembersOn(this.participantFacade.handleParticipantCurrentPageReload(), () =>
			this.facade.reloadGroupMembersPage(this.groupId()),
		);
	}

	private reloadMembersOn(events: Observable<unknown>, reload: () => void): void {
		events
			.pipe(tap(() => this.closeFormAndReload(reload)))
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	private closeFormAndReload(reload: () => void): void {
		this.createMemberFormLayerOpened.set(false);
		reload();
	}

	protected closeLayer(event: Event, opened: WritableSignal<boolean>): void {
		if (EventHelper.isFromHost(event)) opened.set(false);
	}

	protected initAddMembersForm(): void {
		this.addMembersForm().reset(emptyAddMembersFormModel());
		this.addMembersFormLayerOpened.set(true);
	}

	protected initCreateMemberForm(): void {
		this.createMemberFormLayerOpened.set(true);
	}

	protected search(model: GroupMemberListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.facade.fetchGroupMembersPage(this.groupId(), 0, undefined);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(GROUP_MEMBER_LIST_DEFAULTS);
		this.search();
	}

	private inputSearch(model: GroupMemberListSearchModel): void {
		const search = toGroupMemberListSearchParams(model);
		this.facade.inputMembersPageSearchParameters(search.q, search.status, search.isVisible, search.sort);
	}

	protected loadBatch(pageEvent: PageEventModel): void {
		this.facade.fetchGroupMembersPage(this.groupId(), pageEvent.page, pageEvent.size);
	}

	protected handleSearch(searched: string | undefined): void {
		this.facade.searchParticipants(searched);
	}

	protected addMembers(): void {
		this.addMembersForm().markAsTouched();
		if (this.addMembersForm().invalid()) {
			return;
		}

		this.facade
			.addMembersToGroup(this.groupId(), toMemberIds(this.addMembersModel()))
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(() => this.addMembersFormLayerOpened.set(false));
	}

	private groupId(): string {
		return this.route.snapshot.params['groupId'];
	}

	private hasProjectAuthority(authority: ProjectAuthorityEnum): boolean {
		return CurrentUserHelper.hasProjectAuthority(
			this.sessionFacade.currentUser(),
			this.facade.selectedProjectId(),
			authority,
		);
	}
}

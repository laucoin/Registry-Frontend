import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import {
	ParticipantsListSearchModel,
	toParticipantsListSearchModel,
	toParticipantsListSearchParams,
} from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.search';
import { ParticipantsSearchFieldsComponent } from '@pages/projects/[projectId]/configuration/participants/participants-search-fields/participants-search-fields.component';
import { GroupStatusFacade } from '@pages/projects/[projectId]/participants/data/state/group-status.facade';
import { CheckedChangeModel } from '@pages/projects/[projectId]/participants/group-status-list/group-members-panel/group-members-panel.component';
import {
	GroupMembersRequestModel,
	GroupStatusListComponent,
} from '@pages/projects/[projectId]/participants/group-status-list/group-status-list.component';
import { ParticipantsRollCallComponent } from '@pages/projects/[projectId]/participants/participants-roll-call/participants-roll-call.component';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { injectSearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query';
import { sortQueryCodec } from '@shared/helpers/search/sort-query';
import { StringHelper } from '@shared/helpers/string.helper';
import { ParticipantsTabEnum } from '@shared/models/enumeration/participants-tab.enum';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { MonitoringRowComponent } from '@shared/ui/domain/monitoring-row/monitoring-row.component';
import { ProjectParticipantOverviewComponent } from '@shared/ui/domain/project-participant-overview/project-participant-overview.component';

import '@sgdf/ui/badge';
import '@sgdf/ui/list-item';
import '@sgdf/ui/page-title';
import '@sgdf/ui/skeleton';
import '@sgdf/ui/tab-group';

const PAGE_SIZE = 20;
const TAB_PARAM = 'tab';
const PARTICIPANTS_MONITORING_DEFAULTS = toParticipantsListSearchModel({
	q: undefined,
	status: undefined,
	isVisible: undefined,
	sort: undefined,
});
const PARTICIPANTS_MONITORING_QUERY_SCHEMA: SearchQuerySchema<ParticipantsListSearchModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	status: Object.values(PresenceStatusEnum),
};

const PARTICIPANTS_MONITORING_SORT_FIELDS: readonly string[] = ['lastName', 'firstName', 'status'];
/**
 * Objectif: Page de suivi de l'endroit où se trouvent les participants : par mes groupes, par tous les groupes, ou un par un.
 * Périmètre: Affiche les compteurs de participants sur ordinateur au-dessus des onglets, laisse l'appel cocher participants, groupes et lignes indifféremment, garde l'onglet actif dans l'url et charge le premier lot de chaque onglet à l'affichage, pour que les compteurs des onglets s'affichent ensemble et que les onglets ne sautent pas. L'onglet de mes groupes n'existe que si l'utilisateur en a.
 * Limites: Ne détient aucun état de domaine, seulement les coches de l'appel, qui vivent dans la page et sont perdues au rechargement ; les facades de statut de groupe et de participant possèdent les données. Les membres d'un groupe sont chargés à l'ouverture de sa section.
 */
@Component({
	selector: 'app-participants-monitoring',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	imports: [
		TranslocoPipe,
		RegistryTemplateDirective,
		ListComponent,
		SectionErrorComponent,
		GroupStatusListComponent,
		MonitoringRowComponent,
		ProjectParticipantOverviewComponent,
		ParticipantsRollCallComponent,
		ParticipantsSearchFieldsComponent,
	],
	templateUrl: './participants-monitoring.page.html',
})
export class ParticipantsMonitoringPage implements OnInit {
	protected readonly ParticipantsTabEnum = ParticipantsTabEnum;
	protected readonly groups = inject(GroupStatusFacade);
	protected readonly participants = inject(ParticipantFacade);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly queryParams = toSignal(this.route.queryParamMap);

	protected readonly ready = computed(
		() =>
			this.settled(
				this.groups.myGroupsPage(),
				this.groups.myGroupsPageLoading(),
				this.groups.myGroupsPageError(),
			) &&
			this.settled(this.groups.groupsPage(), this.groups.groupsPageLoading(), this.groups.groupsPageError()) &&
			this.settled(
				this.participants.participantsPage(),
				this.participants.participantsPageLoading(),
				this.participants.participantsPageError(),
			),
	);
	protected readonly hasMine = computed(() => (this.groups.myGroupsPage()?.totalElements ?? 0) > 0);
	protected readonly tabs: Signal<ParticipantsTabEnum[]> = computed((): ParticipantsTabEnum[] =>
		this.hasMine()
			? [ParticipantsTabEnum.MINE, ParticipantsTabEnum.GROUPS, ParticipantsTabEnum.INDIVIDUAL]
			: [ParticipantsTabEnum.GROUPS, ParticipantsTabEnum.INDIVIDUAL],
	);
	protected readonly activeTab: Signal<ParticipantsTabEnum> = computed(
		(): ParticipantsTabEnum =>
			this.tabs().find((tab: ParticipantsTabEnum) => tab === this.queryParams()?.get(TAB_PARAM)) ??
			this.tabs()[0],
	);
	protected readonly counts: Signal<Record<ParticipantsTabEnum, number | undefined>> = computed(
		(): Record<ParticipantsTabEnum, number | undefined> => ({
			[ParticipantsTabEnum.MINE]: this.groups.myGroupsPage()?.totalElements,
			[ParticipantsTabEnum.GROUPS]: this.groups.groupsPage()?.totalElements,
			[ParticipantsTabEnum.INDIVIDUAL]: this.participants.participantsPage()?.totalElements,
		}),
	);

	protected readonly checkedIds = signal<ReadonlySet<string>>(new Set());

	protected readonly activeFilters = computed(
		() =>
			[
				StringHelper.isNotNullNorBlank(this.participants.participantsPageQueryParam()),
				this.participants.participantsPageStatusParam() !== undefined,
			].filter(Boolean).length,
	);

	protected readonly model = signal(PARTICIPANTS_MONITORING_DEFAULTS);
	protected readonly sortFields: readonly string[] = PARTICIPANTS_MONITORING_SORT_FIELDS;
	protected readonly form = createSearchForm(this.model);
	protected readonly searchQuery = injectSearchQuery({
		schema: PARTICIPANTS_MONITORING_QUERY_SCHEMA,
		defaults: PARTICIPANTS_MONITORING_DEFAULTS,
		model: this.model,
		extra: sortQueryCodec<ParticipantsListSearchModel>(PARTICIPANTS_MONITORING_SORT_FIELDS),
		search: (model) => this.search(model),
		apply: (model, initial) => {
			this.inputSearch(model);
			if (!initial) {
				this.participants.fetchParticipantsPage(0, PAGE_SIZE);
			}
		},
	});

	public ngOnInit(): void {
		this.fetchFirstMyGroups();
		this.loadFirstBatchOfTheOtherTabs();
	}

	protected fetchFirstMyGroups(): void {
		this.groups.fetchMyGroupsPage(undefined, PAGE_SIZE);
	}

	protected rowOf(participant: ParticipantModel): MonitoringRowModel {
		return MonitoringRowHelper.fromParticipant(participant);
	}

	protected onTabShow(event: Event): void {
		const tab: string | undefined = (event as CustomEvent<{ name: string }>).detail?.name;
		if (tab && tab !== this.activeTab()) {
			this.router
				.navigate([], {
					relativeTo: this.route,
					queryParams: { [TAB_PARAM]: tab },
					queryParamsHandling: 'merge',
					replaceUrl: true,
				})
				.catch((): void => undefined);
		}
	}

	protected loadMyGroups(event: PageEventModel): void {
		this.groups.fetchMyGroupsPage(event.page, event.size);
	}

	protected loadGroups(event: PageEventModel): void {
		this.groups.fetchGroupsPage(event.page, event.size);
	}

	protected setChecked(change: CheckedChangeModel): void {
		this.checkedIds.update((current): ReadonlySet<string> => {
			const next = new Set<string>(current);
			change.ids.forEach((id) => {
				if (change.checked) {
					next.add(id);
				} else {
					next.delete(id);
				}
			});
			return next;
		});
	}

	protected uncheckAll(): void {
		this.checkedIds.set(new Set());
	}

	protected loadGroupMembers(request: GroupMembersRequestModel): void {
		this.groups.fetchGroupMembersPage(request.groupId, request.page, request.size);
	}

	protected loadParticipants(event: PageEventModel): void {
		this.participants.fetchParticipantsPage(event.page, event.size);
	}

	protected search(model: ParticipantsListSearchModel = this.model()): void {
		this.inputSearch(model);
		this.participants.fetchParticipantsPage(0, PAGE_SIZE);
		this.searchQuery.write(model);
	}

	protected resetFilters(): void {
		this.model.set(PARTICIPANTS_MONITORING_DEFAULTS);
		this.search();
	}

	private inputSearch(model: ParticipantsListSearchModel): void {
		const search = toParticipantsListSearchParams(model);
		this.participants.inputPageSearchParameters(search.q, search.status, undefined, search.sort);
	}

	private settled(page: unknown, loading: boolean, error: unknown): boolean {
		return !loading && (page !== undefined || error !== undefined);
	}

	private loadFirstBatchOfTheOtherTabs(): void {
		if (!this.groups.groupsPage() && !this.groups.groupsPageLoading()) {
			this.groups.fetchGroupsPage(undefined, PAGE_SIZE);
		}
		const missing = !this.participants.participantsPage() && !this.participants.participantsPageLoading();
		if (missing || this.participants.participantsPageResetSearch()) {
			this.participants.fetchParticipantsPage(undefined, PAGE_SIZE);
		}
	}
}

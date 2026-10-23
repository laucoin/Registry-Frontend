import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FieldTree, FormField } from '@angular/forms/signals'
import { ActivatedRoute, ParamMap, Router } from '@angular/router'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/badge'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/list-item'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import '@sgdf/ui/skeleton'
import '@sgdf/ui/tab-group'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import {
    ParticipantsListSearchModel,
    toParticipantsListSearchModel,
    toParticipantsListSearchParams,
} from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.search'
import { GroupStatusFacade } from '@pages/projects/[projectId]/participants/data/state/group-status.facade'
import { ProjectEyebrowDirective } from '@shared/directives/project-eyebrow.directive'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper'
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { StringHelper } from '@shared/helpers/string.helper'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { CheckedChangeModel, GroupMembersRequestModel, GroupStatusListComponent } from '@shared/ui/domain/group-status-list/group-status-list.component'
import { MonitoringRowComponent } from '@shared/ui/domain/monitoring-row/monitoring-row.component'
import { ProjectParticipantOverviewComponent } from '@shared/ui/domain/project-participant-overview/project-participant-overview.component'

type ParticipantsTabKey = 'mine' | 'groups' | 'individual'

const PAGE_SIZE: number = 20
const TAB_PARAM: string = 'tab'
const STATUS_PARAM: string = 'status'

/**
 * Purpose: Page tracking where the participants are: through my groups, through every group, or one by one.
 * Scope: Shows the participant counters on desktop above the tabs, lets the roll call tick participants, groups and rows alike, keeps the active tab in the url and loads the first batch of every tab when displayed, so that the counters of the tabs show together and the tabs do not jump. The tab of my groups exists only when the user has some.
 * Limits: Holds no domain state, only the ticks of the roll call, which live in the page and are lost on reload; the group status and participant facades own the data. The members of a group are loaded when its section opens.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-participants-monitoring',
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    providers: [ provideTranslocoScope( 'project-home' ) ],
    imports: [
        TranslocoPipe,
        PluralTranslationPipe,
        FormField,
        ProjectEyebrowDirective,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        ListComponent,
        SectionErrorComponent,
        GroupStatusListComponent,
        MonitoringRowComponent,
        ProjectParticipantOverviewComponent,
    ],
    templateUrl: './participants-monitoring.page.html',
})
export class ParticipantsMonitoringPage implements OnInit {
    protected readonly groups: GroupStatusFacade = inject( GroupStatusFacade )
    protected readonly participants: ParticipantFacade = inject( ParticipantFacade )
    private readonly route: ActivatedRoute = inject( ActivatedRoute )
    private readonly router: Router = inject( Router )
    private readonly queryParams: Signal<ParamMap | undefined> = toSignal( this.route.queryParamMap )

    protected readonly ready: Signal<boolean> = computed( (): boolean =>
        this.settled( this.groups.myGroupsPage(), this.groups.myGroupsPageLoading(), this.groups.myGroupsPageError() )
        && this.settled( this.groups.groupsPage(), this.groups.groupsPageLoading(), this.groups.groupsPageError() )
        && this.settled( this.participants.participantsPage(), this.participants.participantsPageLoading(), this.participants.participantsPageError() ),
    )
    protected readonly hasMine: Signal<boolean> = computed( (): boolean => (this.groups.myGroupsPage()?.totalElements ?? 0) > 0 )
    protected readonly tabs: Signal<ParticipantsTabKey[]> = computed( (): ParticipantsTabKey[] =>
        this.hasMine() ? [ 'mine', 'groups', 'individual' ] : [ 'groups', 'individual' ],
    )
    protected readonly activeTab: Signal<ParticipantsTabKey> = computed( (): ParticipantsTabKey =>
        this.tabs().find( (tab: ParticipantsTabKey): boolean => tab === this.queryParams()?.get( TAB_PARAM ) ) ?? this.tabs()[ 0 ]!,
    )
    protected readonly counts: Signal<Record<ParticipantsTabKey, number | undefined>> = computed( (): Record<ParticipantsTabKey, number | undefined> => ({
        mine: this.groups.myGroupsPage()?.totalElements,
        groups: this.groups.groupsPage()?.totalElements,
        individual: this.participants.participantsPage()?.totalElements,
    }) )

    protected readonly checkedIds: WritableSignal<ReadonlySet<string>> = signal<ReadonlySet<string>>( new Set() )

    protected readonly activeFilters: Signal<number> = computed( (): number => [
        StringHelper.isNotNullNorBlank( this.participants.participantsPageQueryParam() ),
        this.participants.participantsPageStatusParam() !== undefined,
    ].filter( Boolean ).length )

    protected readonly model: WritableSignal<ParticipantsListSearchModel> = signal( toParticipantsListSearchModel( {
        q: this.participants.participantsPageQueryParam(),
        status: this.participants.participantsPageStatusParam(),
        isVisible: undefined,
    } ) )
    protected readonly form: FieldTree<ParticipantsListSearchModel> = createSearchForm( this.model )

    public constructor () {
        this.presetStatusFromUrl()
    }

    public ngOnInit (): void {
        this.fetchFirstMyGroups()
        this.loadFirstBatchOfTheOtherTabs()
    }

    protected fetchFirstMyGroups (): void {
        this.groups.fetchMyGroupsPage( undefined, PAGE_SIZE )
    }

    protected rowOf (participant: ParticipantModel): MonitoringRowModel {
        return MonitoringRowHelper.fromParticipant( participant )
    }

    protected onTabShow (event: Event): void {
        const tab: string | undefined = (event as CustomEvent<{ name: string }>).detail?.name
        if (tab && tab !== this.activeTab()) {
            this.router.navigate( [], { relativeTo: this.route, queryParams: { [ TAB_PARAM ]: tab }, queryParamsHandling: 'merge', replaceUrl: true } ).then()
        }
    }

    protected loadMyGroups (event: PageEventModel): void {
        this.groups.fetchMyGroupsPage( event.page, event.size )
    }

    protected loadGroups (event: PageEventModel): void {
        this.groups.fetchGroupsPage( event.page, event.size )
    }

    protected setChecked (change: CheckedChangeModel): void {
        this.checkedIds.update( (current: ReadonlySet<string>): ReadonlySet<string> => {
            const next: Set<string> = new Set( current )
            change.ids.forEach( (id: string): void => { change.checked ? next.add( id ) : next.delete( id ) } )
            return next
        } )
    }

    protected uncheckAll (): void {
        this.checkedIds.set( new Set() )
    }

    protected loadGroupMembers (request: GroupMembersRequestModel): void {
        this.groups.fetchGroupMembersPage( request.groupId, request.page, request.size )
    }

    protected loadParticipants (event: PageEventModel): void {
        this.participants.fetchParticipantsPage( event.page, event.size )
    }

    protected search (): void {
        const search: ReturnType<typeof toParticipantsListSearchParams> = toParticipantsListSearchParams( this.model() )
        this.participants.inputPageSearchParameters( search.q, search.status, undefined )
        this.participants.fetchParticipantsPage( 0, PAGE_SIZE )
    }

    protected resetFilters (): void {
        this.model.set( { q: '', status: '', isVisible: '' } )
        this.search()
    }

    private presetStatusFromUrl (): void {
        const status: string | null = this.route.snapshot.queryParamMap.get( STATUS_PARAM )
        if (status) {
            this.participants.inputPageSearchParameters( undefined, status, undefined )
            this.model.update( (current: ParticipantsListSearchModel): ParticipantsListSearchModel => ({ ...current, status }) )
        }
    }

    private settled (page: unknown, loading: boolean, error: unknown): boolean {
        return !loading && (page !== undefined || error !== undefined)
    }

    private loadFirstBatchOfTheOtherTabs (): void {
        if (!this.groups.groupsPage() && !this.groups.groupsPageLoading()) {
            this.groups.fetchGroupsPage( undefined, PAGE_SIZE )
        }
        if (!this.participants.participantsPage() && !this.participants.participantsPageLoading()) {
            this.participants.fetchParticipantsPage( undefined, PAGE_SIZE )
        }
    }
}

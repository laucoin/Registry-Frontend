import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject, OnInit, signal, Signal, untracked, WritableSignal } from '@angular/core'
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
import { ParticipantModel } from '@shared/models/model/participant.model'
import { StringHelper } from '@shared/helpers/string.helper'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { GroupStatusListComponent } from '@shared/ui/domain/group-status-list/group-status-list.component'
import { MonitoringRowComponent } from '@shared/ui/domain/monitoring-row/monitoring-row.component'
import { ProjectParticipantOverviewComponent } from '@shared/ui/domain/project-participant-overview/project-participant-overview.component'

type ParticipantsTabKey = 'mine' | 'groups' | 'individual'

const PAGE_SIZE: number = 20
const TAB_PARAM: string = 'tab'

/**
 * Purpose: Page tracking where the participants are: through my groups, through every group, or one by one.
 * Scope: Shows the participant counters on desktop above the tabs, keeps the active tab in the url and loads a tab only when it is shown. The tab of my groups exists only when the user has some.
 * Limits: Holds no domain state; the group status and participant facades own it. Groups come from a static source until the backend serves them.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-participants-monitoring',
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    providers: [ provideTranslocoScope( 'project-home' ) ],
    imports: [
        TranslocoPipe,
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
        !this.groups.myGroupsPageLoading() && (this.groups.myGroupsPage() !== undefined || this.groups.myGroupsPageError() !== undefined),
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
        effect( (): void => {
            const tab: ParticipantsTabKey = this.activeTab()
            if (this.ready()) {
                untracked( (): void => this.loadFirstBatch( tab ) )
            }
        } )
    }

    public ngOnInit (): void {
        this.fetchFirstMyGroups()
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

    private loadFirstBatch (tab: ParticipantsTabKey): void {
        if (tab === 'groups' && !this.groups.groupsPage() && !this.groups.groupsPageLoading()) {
            this.groups.fetchGroupsPage( undefined, PAGE_SIZE )
        }
        if (tab === 'individual' && !this.participants.participantsPage() && !this.participants.participantsPageLoading()) {
            this.participants.fetchParticipantsPage( undefined, PAGE_SIZE )
        }
    }
}

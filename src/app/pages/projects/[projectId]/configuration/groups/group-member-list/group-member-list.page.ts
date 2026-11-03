import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive'
import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { sortQueryCodec } from '@shared/helpers/search/sort-query'
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component'
import { injectSearchQuery, SearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query'
import { GROUP_MEMBER_LIST_SORT_FIELDS, GroupMemberListSearchModel, toGroupMemberListSearchModel, toGroupMemberListSearchParams } from './group-member-list.search'
import { NgTemplateOutlet } from '@angular/common'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal, model, ModelSignal, DestroyRef } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { GroupModel } from '@shared/models/model/group.model'
import { withLoading } from '@shared/helpers/rx.helper'
import {
    AddMembersFormModel,
    createAddMembersForm,
    emptyAddMembersFormModel,
    toMemberIds,
} from '@pages/projects/[projectId]/configuration/groups/group-member-list/add-members.form'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { ParticipantRowComponent } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-row.component'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import '@sgdf/ui/button'
import '@sgdf/ui/drawer'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import '@sgdf/ui/skeleton'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import { Observable, switchMap, tap } from 'rxjs'
import { GroupMembersFieldComponent } from '@shared/ui/domain/group-members-field/group-members-field.component'
import { UiFacade } from '@core/registry/state/ui.facade'
import { EventHelper } from '@shared/helpers/event.helper'
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantFormComponent } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'

const GROUP_MEMBER_LIST_DEFAULTS: GroupMemberListSearchModel = toGroupMemberListSearchModel( { q: undefined, status: undefined, isVisible: undefined, sort: undefined } )
const GROUP_MEMBER_LIST_QUERY_SCHEMA: SearchQuerySchema<GroupMemberListSearchModel> = { q: 'text', status: 'text', isVisible: 'choice' }

/**
 * Purpose: Page listant les membres d'un groupe avec recherche et déclencheur « charger plus », et les formulaires d'ajout ou de création de membres.
 * Scope: Lie le composant de liste à la facade des groupes, possède le formulaire de recherche, donne à la liste le template de ligne d'un participant et ouvre les couches d'ajout et de création de membres.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component( {
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
} )
export class GroupMemberListPage {
    protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_RESTORE

    private readonly destroyRef: DestroyRef = inject( DestroyRef )
    protected readonly facade: GroupFacade = inject( GroupFacade )
    protected readonly participantFacade: ParticipantFacade = inject( ParticipantFacade )
    private readonly route: ActivatedRoute = inject( ActivatedRoute )
    private readonly sessionFacade: SessionFacade = inject( SessionFacade )
    protected readonly uiFacade: UiFacade = inject( UiFacade )

    protected readonly group: WritableSignal<GroupModel | undefined> = signal( undefined )
    protected readonly groupLoading: WritableSignal<boolean> = signal( false )

    protected readonly addMembersModel: WritableSignal<AddMembersFormModel> = signal( emptyAddMembersFormModel() )
    protected readonly addMembersForm: FieldTree<AddMembersFormModel> = createAddMembersForm( this.addMembersModel )
    protected readonly addMembersFormLayerOpened: ModelSignal<boolean> = model<boolean>( false )

    protected readonly createMemberFormLayerOpened: ModelSignal<boolean> = model<boolean>( false )

    protected readonly canAddMembers: Signal<boolean> = computed( (): boolean => this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U ) )
    protected readonly canCreateMember: Signal<boolean> = computed( (): boolean =>
        this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_C ) && this.hasProjectAuthority( ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_U ),
    )

    protected readonly activeFilters: Signal<number> = computed( (): number => [
        StringHelper.isNotNullNorBlank( this.facade.groupMembersPageQueryParam() ),
        this.facade.groupMembersPageStatusParam() !== undefined,
        this.facade.groupMembersPageIsVisibleParam() !== undefined,
    ].filter( Boolean ).length )

    protected readonly sortFields: readonly string[] = GROUP_MEMBER_LIST_SORT_FIELDS
    protected readonly model: WritableSignal<GroupMemberListSearchModel> = signal( GROUP_MEMBER_LIST_DEFAULTS )
    protected readonly form: FieldTree<GroupMemberListSearchModel> = createSearchForm( this.model )
    private readonly searchQuery: SearchQuery = injectSearchQuery( {
        schema: GROUP_MEMBER_LIST_QUERY_SCHEMA,
        defaults: GROUP_MEMBER_LIST_DEFAULTS,
        model: this.model,
        extra: sortQueryCodec<GroupMemberListSearchModel>( GROUP_MEMBER_LIST_SORT_FIELDS ),
        apply: (model: GroupMemberListSearchModel): void => {
            this.inputSearch( model )
            this.facade.fetchGroupMembersPage( this.groupId(), undefined, undefined )
        },
    } )

    public constructor () {
        this.loadData()
        this.handleParticipantActions()
    }

    protected loadData (): void {
        const id: string | undefined = this.route.snapshot.params['groupId']
        this.facade.fetchGroup( id! ).pipe(
                withLoading( this.groupLoading ),
            ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe( (group: GroupModel): void => this.group.set( group ) )
    }

    private handleParticipantActions (): void {
        this.facade.handleGroupMembersChange().pipe(
                switchMap( (): Observable<GroupModel> => this.facade.fetchGroup( this.groupId() ) ),
            ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe( (group: GroupModel): void => this.group.set( group ) )
        this.reloadMembersOn( this.participantFacade.handleParticipantFirstPageReload(), (): void => this.facade.fetchGroupMembersPage( this.groupId(), 0, undefined ) )
        this.reloadMembersOn( this.participantFacade.handleParticipantCurrentPageReload(), (): void => this.facade.reloadGroupMembersPage( this.groupId() ) )
    }

    private reloadMembersOn (events: Observable<unknown>, reload: () => void): void {
        events.pipe(
            tap( (): void => {
                this.createMemberFormLayerOpened.set( false )
                reload()
            } ),
        ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe()
    }

    protected closeLayer (event: Event, opened: WritableSignal<boolean>): void {
        if (EventHelper.isFromHost( event )) opened.set( false )
    }

    protected initAddMembersForm (): void {
        this.addMembersForm().reset( emptyAddMembersFormModel() )
        this.addMembersFormLayerOpened.set( true )
    }

    protected initCreateMemberForm (): void {
        this.createMemberFormLayerOpened.set( true )
    }

    protected search (): void {
        this.inputSearch( this.model() )
        this.facade.fetchGroupMembersPage( this.groupId(), 0, undefined )
        this.searchQuery.write()
    }

    protected resetFilters (): void {
        this.model.set( GROUP_MEMBER_LIST_DEFAULTS )
        this.search()
    }

    private inputSearch (model: GroupMemberListSearchModel): void {
        const search: ReturnType<typeof toGroupMemberListSearchParams> = toGroupMemberListSearchParams( model )
        this.facade.inputMembersPageSearchParameters( search.q, search.status, search.isVisible, search.sort )
    }

    protected loadBatch (pageEvent: PageEventModel): void {
        this.facade.fetchGroupMembersPage( this.groupId(), pageEvent.page, pageEvent.size )
    }

    protected handleSearch (searched: string | undefined): void {
        this.facade.searchParticipants( searched )
    }

    protected addMembers (): void {
        this.addMembersForm().markAsTouched()
        if (this.addMembersForm().invalid()) {
            return
        }

        this.facade.addMembersToGroup( this.groupId(), toMemberIds( this.addMembersModel() ) ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe( (): void => {
                this.addMembersFormLayerOpened.set( false )
            } )
    }

    private groupId (): string {
        return this.route.snapshot.params['groupId']
    }

    private hasProjectAuthority (authority: ProjectAuthorityEnum): boolean {
        return CurrentUserHelper.hasProjectAuthority( this.sessionFacade.currentUser(), this.facade.selectedProjectId(), authority )
    }
}

import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive'
import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { GroupMemberListSearchModel, toGroupMemberListSearchModel, toGroupMemberListSearchParams } from './group-member-list.search'
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
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import { Observable, switchMap, tap } from 'rxjs'
import { UiFacade } from '@core/registry/state/ui.facade'
import { EventHelper } from '@shared/helpers/event.helper'
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ParticipantFormComponent } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'

/**
 * Purpose: Page listing the members of a group with search and a "load more" trigger, and the forms to add or create members.
 * Scope: Binds the list component to the group facade, owns the search form, gives the list the row template of a participant and opens the add and create member layers.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component( {
    selector: 'app-group-member-list',
    imports: [
        IfProjectAuthorityDirective,
        ListComponent,
        ParticipantRowComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        BooleanChoicePipe,
        NgTemplateOutlet,
        FormField,
        TranslocoPipe,
        SelectElementsFieldComponent,
        FormActionsComponent,
        PluralTranslationPipe,
        ParticipantFormComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './group-member-list.page.html',
} )
export class GroupMemberListPage {
    protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_D

    private readonly destroyRef: DestroyRef = inject( DestroyRef )
    protected readonly facade: GroupFacade = inject( GroupFacade )
    protected readonly participantFacade: ParticipantFacade = inject( ParticipantFacade )
    private readonly route: ActivatedRoute = inject( ActivatedRoute )
    private readonly sessionFacade: SessionFacade = inject( SessionFacade )
    protected readonly uiFacade: UiFacade = inject( UiFacade )

    protected readonly ParticipantHelper: typeof ParticipantHelper = ParticipantHelper

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

    protected readonly model: WritableSignal<GroupMemberListSearchModel> = signal( toGroupMemberListSearchModel( {
        q: this.facade.groupMembersPageQueryParam(),
        status: this.facade.groupMembersPageStatusParam(),
        isVisible: this.facade.groupMembersPageIsVisibleParam(),
    } ) )
    protected readonly form: FieldTree<GroupMemberListSearchModel> = createSearchForm( this.model )

    public constructor () {
        this.loadData()
        this.handleParticipantActions()
    }

    protected loadData (): void {
        const id: string | undefined = this.route.snapshot.params['groupId']
        this.facade.fetchGroup( id! ).pipe(
                withLoading( this.groupLoading ),
            ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe( (group: GroupModel): void => this.group.set( group ) )
        this.facade.fetchGroupMembersPage( id!, undefined, undefined )
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
        const search: ReturnType<typeof toGroupMemberListSearchParams> = toGroupMemberListSearchParams( this.model() )
        this.facade.inputMembersPageSearchParameters( search.q, search.status, search.isVisible )
        this.facade.fetchGroupMembersPage( this.groupId(), 0, undefined )
    }

    protected resetFilters (): void {
        this.model.set( { q: '', status: '', isVisible: '' } )
        this.search()
    }

    protected loadBatch (pageEvent: PageEventModel): void {
        this.facade.fetchGroupMembersPage( this.groupId(), pageEvent.page, pageEvent.size )
    }

    protected handleSearch (searched: string | undefined): void {
        this.addMembersForm.participants().markAsTouched()
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

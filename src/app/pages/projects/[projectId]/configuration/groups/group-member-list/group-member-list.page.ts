import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { GroupMemberListSearchModel, toGroupMemberListSearchModel, toGroupMemberListSearchParams } from './group-member-list.search'
import { NgTemplateOutlet } from '@angular/common'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, signal, Signal, WritableSignal, model, ModelSignal } from '@angular/core'
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
import { Button } from 'primeng/button'
import { ParticipantRowComponent } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-row.component'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import '@sgdf/ui/skeleton'
import { ProjectEyebrowDirective } from '@shared/directives/project-eyebrow.directive'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import { LayerComponent } from '@shared/ui/common/layer/layer.component'
import { RegistryRequiredDirective } from '@shared/directives/registry-required.directive'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import { Observable, Subscription, switchMap, tap } from 'rxjs'
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component'
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
        ProjectEyebrowDirective,
        ListComponent,
        ParticipantRowComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        BooleanChoicePipe,
        NgTemplateOutlet,
        Button,
        FormField,
        TranslocoPipe,
        LayerComponent,
        RegistryRequiredDirective,
        SelectElementsFieldComponent,
        FieldErrorComponent,
        PluralTranslationPipe,
        ParticipantFormComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './group-member-list.page.html',
} )
export class GroupMemberListPage implements OnDestroy {
    protected readonly facade: GroupFacade = inject( GroupFacade )
    protected readonly participantFacade: ParticipantFacade = inject( ParticipantFacade )
    private readonly route: ActivatedRoute = inject( ActivatedRoute )
    private readonly sessionFacade: SessionFacade = inject( SessionFacade )

    protected readonly ParticipantHelper: typeof ParticipantHelper = ParticipantHelper

    private readonly subscriptions: Subscription = new Subscription()

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
        StringHelper.isNotNullNorBlank( this.facade.groupMembersPageTextSearchedParam() ),
        this.facade.groupMembersPageStatusSearchedParam() !== undefined,
        this.facade.groupMembersPageVisibilitySearchedParam() !== undefined,
    ].filter( Boolean ).length )

    protected readonly model: WritableSignal<GroupMemberListSearchModel> = signal( toGroupMemberListSearchModel( {
        q: this.facade.groupMembersPageTextSearchedParam(),
        status: this.facade.groupMembersPageStatusSearchedParam(),
        isVisible: this.facade.groupMembersPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<GroupMemberListSearchModel> = createSearchForm( this.model )

    public constructor () {
        this.loadData()
        this.handleParticipantActions()
    }

    protected loadData (): void {
        const id: string | undefined = this.route.snapshot.params['groupId']
        this.subscriptions.add(
            this.facade.fetchGroup( id! ).pipe(
                withLoading( this.groupLoading ),
            ).subscribe( (group: GroupModel): void => this.group.set( group ) ),
        )
        this.facade.fetchGroupMembersPage( id!, undefined, undefined )
    }

    private handleParticipantActions (): void {
        this.subscriptions.add(
            this.facade.handleGroupMembersChange().pipe(
                switchMap( (): Observable<GroupModel> => this.facade.fetchGroup( this.groupId() ) ),
            ).subscribe( (group: GroupModel): void => this.group.set( group ) ),
        )
        this.reloadMembersOn( this.participantFacade.handleParticipantFirstPageReload(), (): void => this.facade.fetchGroupMembersPage( this.groupId(), 0, undefined ) )
        this.reloadMembersOn( this.participantFacade.handleParticipantCurrentPageReload(), (): void => this.facade.reloadGroupMembersPage( this.groupId() ) )
    }

    private reloadMembersOn (events: Observable<unknown>, reload: () => void): void {
        this.subscriptions.add( events.pipe(
            tap( (): void => {
                this.createMemberFormLayerOpened.set( false )
                reload()
            } ),
        ).subscribe() )
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

        this.subscriptions.add(
            this.facade.addMembersToGroup( this.groupId(), toMemberIds( this.addMembersModel() ) ).subscribe( (): void => {
                this.addMembersFormLayerOpened.set( false )
            } ),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    private groupId (): string {
        return this.route.snapshot.params['groupId']
    }

    private hasProjectAuthority (authority: ProjectAuthorityEnum): boolean {
        return CurrentUserHelper.hasProjectAuthority( this.sessionFacade.currentUser(), this.facade.selectedProjectId(), authority )
    }
}

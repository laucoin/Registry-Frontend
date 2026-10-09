import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { GroupMemberListSearchModel, toGroupMemberListSearchModel, toGroupMemberListSearchParams } from './group-member-list.search'
import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
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
import { GroupElementComponent } from '@pages/projects/[projectId]/configuration/groups/group-element/group-element.component'
import { Button } from 'primeng/button'
import { InputText } from 'primeng/inputtext'
import { ListComponent } from '@shared/ui/common/list/list.component'
import {
    ParticipantElementComponent,
} from '@shared/ui/domain/participant-element/participant-element.component'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import { LayerComponent } from '@shared/ui/common/layer/layer.component'
import { RegistryRequiredDirective } from '@shared/directives/registry-required.directive'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import { Observable, Subscription, switchMap, tap } from 'rxjs'
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component'
import { Select } from 'primeng/select'
import { GenericListComponent } from '@shared/ui/base/generic-list.component'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ParticipantFormComponent } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'
import { ElementSkeletonComponent } from '@shared/ui/common/element-skeleton/element-skeleton.component'
import { Card } from 'primeng/card'

/**
 * Purpose: Page listing the group member with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component( {
    selector: 'app-group-member-list',
    imports: [
        GroupElementComponent,
        Button,
        InputText,
        ListComponent,
        ParticipantElementComponent,
        FormField,
        RegistryTemplateDirective,
        TranslocoPipe,
        LayerComponent,
        RegistryRequiredDirective,
        SelectElementsFieldComponent,
        FieldErrorComponent,
        Select,
        PluralTranslationPipe,
        ParticipantFormComponent,
        ElementSkeletonComponent,
        Card,

    ],
    templateUrl: './group-member-list.page.html',
} )
export class GroupMemberListPage extends GenericListComponent implements OnDestroy {
    protected readonly facade: GroupFacade = inject( GroupFacade )
    protected readonly participantFacade: ParticipantFacade = inject( ParticipantFacade )

    protected readonly ParticipantHelper: typeof ParticipantHelper = ParticipantHelper

    private readonly subscriptions: Subscription = new Subscription()

    protected readonly group: WritableSignal<GroupModel | undefined> = signal( undefined )
    protected readonly groupLoading: WritableSignal<boolean> = signal( false )

    protected readonly addMembersModel: WritableSignal<AddMembersFormModel> = signal( emptyAddMembersFormModel() )
    protected readonly addMembersForm: FieldTree<AddMembersFormModel> = createAddMembersForm( this.addMembersModel )
    protected addMembersFormLayerOpened: boolean = false

    protected createMemberFormLayerOpened: boolean = false

    protected readonly model: WritableSignal<GroupMemberListSearchModel> = signal( toGroupMemberListSearchModel( {
        textSearched: this.facade.groupMembersPageTextSearchedParam(),
        statusSearched: this.facade.groupMembersPageStatusSearchedParam(),
        visibilitySearched: this.facade.groupMembersPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<GroupMemberListSearchModel> = createSearchForm( this.model )

    public constructor () {
        super()

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
        this.facade.fetchGroupMembersPage( id!, undefined, undefined)
    }

    private handleParticipantActions (): void {
        this.subscriptions.add(
            this.facade.handleGroupMembersChange().pipe(
                switchMap( (): Observable<GroupModel> => this.facade.fetchGroup( this.route.snapshot.params['groupId'] ) ),
            ).subscribe( (group: GroupModel): void => this.group.set( group ) ),
        )
        this.reloadMembersOn( this.participantFacade.handleParticipantFirstPageReload(), undefined, undefined )
        this.reloadMembersOn(
            this.participantFacade.handleParticipantCurrentPageReload(),
            () => this.facade.groupMembersPage()?.pageNumber,
            () => this.facade.groupMembersPage()?.pageSize,
        )
    }

    private reloadMembersOn (events: Observable<unknown>, pageNumber: (() => number | undefined) | undefined, pageSize: (() => number | undefined) | undefined): void {
        this.subscriptions.add( events.pipe(
            tap( (): void => {
                this.createMemberFormLayerOpened = false
                this.facade.fetchGroupMembersPage( this.route.snapshot.params['groupId'], pageNumber?.(), pageSize?.() )
            } ),
        ).subscribe() )
    }

    protected initAddMembersForm (): void {
        this.addMembersForm().reset( emptyAddMembersFormModel() )
        this.addMembersFormLayerOpened = true
    }

    protected initCreateMemberForm (): void {
        this.createMemberFormLayerOpened = true
    }

    protected loadPage (pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toGroupMemberListSearchParams> = toGroupMemberListSearchParams( this.model() )
        this.facade.inputMembersPageSearchParameters(
            search.textSearched,
            search.statusSearched,
            search.visibilitySearched,
        )
        this.facade.fetchGroupMembersPage(
            this.route.snapshot.params['groupId'],
            pageEvent.pageNumber,
            pageEvent.pageSize)
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

        const groupId: string = this.route.snapshot.params['groupId']

        this.subscriptions.add(
            this.facade.addMembersToGroup( groupId, toMemberIds( this.addMembersModel() ) ).subscribe( (): void => {
                this.addMembersFormLayerOpened = false
            } ),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}

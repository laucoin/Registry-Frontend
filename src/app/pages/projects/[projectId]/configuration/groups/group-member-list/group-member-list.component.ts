import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import { GroupModel } from '@shared/models/model/group.model'
import { withLoading } from '@shared/helpers/rx.helper'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupElementComponent } from '@pages/projects/[projectId]/configuration/groups/group-element/group-element.component'
import { Button } from 'primeng/button'
import { InputText } from 'primeng/inputtext'
import { ListComponent } from '@shared/ui/list/list.component'
import {
    ParticipantElementComponent,
} from '@shared/ui/participant-element/participant-element.component'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { TranslatePipe } from '@ngx-translate/core'
import { LayerComponent } from '@shared/ui/layer/layer.component'
import { RegistryRequiredDirective } from '@shared/directives/registry-required.directive'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/select-elements-field/select-elements-field.component'
import { Observable, Subscription, switchMap, tap } from 'rxjs'
import { FormFieldErrorComponent } from '@shared/ui/form-field-error/form-field-error.component'
import { Select } from 'primeng/select'
import { GenericListComponent } from '@shared/ui/base/generic-list.component'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ParticipantFormComponent } from '@pages/projects/[projectId]/configuration/participants/participant-form/participant-form.component'
import { ElementSkeletonComponent } from '@shared/ui/element-skeleton/element-skeleton.component'
import { Card } from 'primeng/card'

@Component( {
    selector: 'app-group-member-list',
    imports: [
        GroupElementComponent,
        Button,
        InputText,
        ListComponent,
        ParticipantElementComponent,
        ReactiveFormsModule,
        RegistryTemplateDirective,
        TranslatePipe,
        LayerComponent,
        RegistryRequiredDirective,
        SelectElementsFieldComponent,
        FormFieldErrorComponent,
        Select,
        PluralTranslationPipe,
        ParticipantFormComponent,
        ElementSkeletonComponent,
        Card,

    ],
    templateUrl: './group-member-list.component.html',
} )
export class GroupMemberListComponent extends GenericListComponent implements OnDestroy {
    protected readonly facade: GroupFacade = inject( GroupFacade )
    protected readonly participantFacade: ParticipantFacade = inject( ParticipantFacade )

    protected readonly ParticipantHelper: typeof ParticipantHelper = ParticipantHelper

    private readonly subscriptions: Subscription = new Subscription()

    protected readonly group: WritableSignal<GroupModel | undefined> = signal( undefined )
    protected readonly groupLoading: WritableSignal<boolean> = signal( false )

    protected addMembersForm: FormGroup | undefined
    protected addMembersFormLayerOpened: boolean = false

    protected createMemberFormLayerOpened: boolean = false

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()
        this.handleParticipantActions()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.facade.groupMembersPageTextSearchedParam() ),
            statusSearched: this.formBuilder.control( this.facade.groupMembersPageStatusSearchedParam() ),
            visibilitySearched: this.formBuilder.control( this.facade.groupMembersPageVisibilitySearchedParam() ),
        } )
    }

    protected loadData (): void {
        const id: string | undefined = this.route.snapshot.params['groupId']
        this.subscriptions.add(
            this.facade.fetchGroup( id! ).pipe(
                withLoading( this.groupLoading ),
            ).subscribe( (group: GroupModel): void => this.group.set( group ) ),
        )
        this.facade.fetchGroupMembersPage( id!, undefined, undefined, false )
    }

    private handleParticipantActions (): void {
        this.subscriptions.add(
            this.facade.handleGroupMembersChange().pipe(
                switchMap( (): Observable<GroupModel> => this.facade.fetchGroup( this.route.snapshot.params['groupId'] ) ),
            ).subscribe( (group: GroupModel): void => this.group.set( group ) ),
        )

        this.subscriptions.add(
            this.participantFacade.handleParticipantFirstPageReload().pipe(
                tap( (): void => {
                    this.createMemberFormLayerOpened = false
                    this.facade.fetchGroupMembersPage(
                        this.route.snapshot.params['groupId'],
                        undefined,
                        undefined,
                        true,
                    )
                } ),
            ).subscribe(),
        )

        this.subscriptions.add(
            this.participantFacade.handleParticipantCurrentPageReload().pipe(
                tap( (): void => {
                    this.createMemberFormLayerOpened = false
                    this.facade.fetchGroupMembersPage(
                        this.route.snapshot.params['groupId'],
                        this.facade.groupsPage()?.pageNumber,
                        this.facade.groupsPage()?.pageSize,
                        true,
                    )
                } ),
            ).subscribe(),
        )
    }

    protected initAddMembersForm (): void {
        this.addMembersForm = this.formBuilder.group( {
            participants: this.formBuilder.control( [], [ Validators.required ] ),
        } )

        this.addMembersFormLayerOpened = true
    }

    protected initCreateMemberForm (): void {
        this.createMemberFormLayerOpened = true
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.inputMembersPageSearchParameters(
            this.textSearched.value,
            this.statusSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchGroupMembersPage(
            this.route.snapshot.params['groupId'],
            pageEvent.pageNumber,
            pageEvent.pageSize,
            false,
        )
    }

    protected handleSearch (searched: string | undefined): void {
        this.addMembersParticipants?.markAsTouched()
        this.facade.searchParticipants( searched )
    }

    protected addMembers (): void {
        if (this.addMembersParticipants?.invalid) {
            return
        }

        const groupId: string = this.route.snapshot.params['groupId']
        const newMemberIds: string[] = this.addMembersParticipants?.value?.map( (item: ParticipantModel): string => item.id ) ?? []

        this.subscriptions.add(
            this.facade.addMembersToGroup( groupId, newMemberIds ).subscribe( (): void => {
                this.addMembersFormLayerOpened = false
            } ),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get statusSearched (): FormControl {
        return this.form.get( 'statusSearched' ) as FormControl
    }

    protected get visibilitySearched (): FormControl {
        return this.form.get( 'visibilitySearched' ) as FormControl
    }

    protected get addMembersParticipants (): FormControl | undefined {
        return this.addMembersForm?.get( 'participants' ) as FormControl | undefined
    }
}

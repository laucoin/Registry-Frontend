import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core'
import { ParticipantModel } from '../../../../../shared/util-model/model/participant.model'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { PageEventModel } from '../../../../../shared/util-model/model/page-event.model'
import { GroupFacade } from '../data/state/group.facade'
import { GroupElementComponent } from '../group-element/group-element.component'
import { Button } from 'primeng/button'
import { InputText } from 'primeng/inputtext'
import { ListComponent } from '../../../../../shared/util-ui/list/list.component'
import {
    ParticipantElementComponent,
} from '../../../../../shared/util-ui/participant-element/participant-element.component'
import { RegistryTemplateDirective } from '../../../../../shared/util-tool/directive/registry-template.directive'
import { TranslatePipe } from '@ngx-translate/core'
import { LayerComponent } from '../../../../../shared/util-ui/layer/layer.component'
import { RegistryRequiredDirective } from '../../../../../shared/util-tool/directive/registry-required.directive'
import {
    SelectElementsFieldComponent,
} from '../../../../../shared/util-ui/select-elements-field/select-elements-field.component'
import { Subscription, tap } from 'rxjs'
import { FormFieldErrorComponent } from '../../../../../shared/util-ui/form-field-error/form-field-error.component'
import { Select } from 'primeng/select'
import { GenericListComponent } from '../../../../../shared/util-tool/component/generic-list.component'
import { ParticipantUtil } from '../../../../../shared/util-tool/util/participant.util'
import { FormUtil } from '../../../../../shared/util-tool/util/form.util'
import { ParticipantFacade } from '../../participant/data/state/participant.facade'
import { PluralTranslationPipe } from '../../../../../shared/util-tool/pipe/plural-translation.pipe'
import { ParticipantFormComponent } from '../../participant/participant-form/participant-form.component'
import { ElementSkeletonComponent } from '../../../../../shared/util-ui/element-skeleton/element-skeleton.component'
import { Card } from 'primeng/card'

@Component( {
    selector: 'app-group-member-list',
    standalone: true,
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
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class GroupMemberListComponent extends GenericListComponent implements OnDestroy {
    protected readonly facade: GroupFacade = inject( GroupFacade )
    protected readonly participantFacade: ParticipantFacade = inject( ParticipantFacade )

    protected readonly FormUtil: typeof FormUtil = FormUtil
    protected readonly ParticipantUtil: typeof ParticipantUtil = ParticipantUtil

    private readonly subscriptions: Subscription = new Subscription()

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
        this.facade.fetchGroup( id! )
        this.facade.fetchGroupMembersPage( id!, undefined, undefined, false )
    }

    private handleParticipantActions (): void {
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
            this.facade.group()!.id,
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

        const groupId: string = this.facade.group()!.id
        const newMemberIds: string[] = this.addMembersParticipants?.value?.map( (item: ParticipantModel): string => item.id ) ?? []

        this.subscriptions.add(
            this.facade.addMembersToGroup( groupId, newMemberIds ).subscribe( (): void => {
                this.addMembersFormLayerOpened = false
                this.facade.fetchGroup( groupId )
                this.facade.fetchGroupMembersPage( groupId, undefined, undefined, true )
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

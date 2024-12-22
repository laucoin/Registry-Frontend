import { Component, OnInit, signal, WritableSignal } from '@angular/core'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { GroupFacade } from '../data/state/group.facade'
import { Params } from '@angular/router'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { AppRouteEnum } from '../../../app-route.enum'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'
import { GroupModel } from '../../../shared/util-model/model/group.model'
import { GroupElementComponent } from '../group-element/group-element.component'
import { AsyncPipe, NgIf } from '@angular/common'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { InputText } from 'primeng/inputtext'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { ParticipantElementComponent } from '../../../shared/util-ui/participant-element/participant-element.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { ToggleButton } from 'primeng/togglebutton'
import { TranslatePipe } from '@ngx-translate/core'
import { ParticipantFacade } from '../../participant/data/state/participant.facade'
import { LayerComponent } from '../../../shared/util-ui/layer/layer.component'
import { FormFieldErrorComponent } from '../../../shared/util-ui/form-field-error/form-field-error.component'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import {
    SelectElementsFieldComponent,
} from '../../../shared/util-ui/select-elements-field/select-elements-field.component'
import { Observable } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { ParticipantFormComponent } from '../../participant/participant-form/participant-form.component'
import { StringUtils } from '../../../shared/util-tool/util/string.util'

@Component( {
    selector: 'app-group-member-list',
    imports: [
        GroupElementComponent,
        AsyncPipe,
        Button,
        DatePicker,
        InputText,
        ListComponent,
        MessageComponent,
        ParticipantElementComponent,
        ReactiveFormsModule,
        RegistryTemplateDirective,
        ToggleButton,
        TranslatePipe,
        NgIf,
        LayerComponent,
        FormFieldErrorComponent,
        RegistryRequiredDirective,
        SelectElementsFieldComponent,
        ParticipantFormComponent,
    ],
    templateUrl: './group-member-list.component.html',
} )
export class GroupMemberListComponent extends GenericListComponent<ParticipantModel> implements OnInit {
    protected readonly group: WritableSignal<GroupModel | undefined> = signal( undefined )
    protected readonly participantsSuggestion$: Observable<SelectItem<ParticipantModel>[]>

    protected addMembersForm: FormGroup | undefined

    protected addMembersFormLayerOpened: boolean = false
    protected createMemberFormLayerOpened: boolean = false

    public constructor (
        private readonly facade: GroupFacade,
        private readonly participantFacade: ParticipantFacade,
    ) {
        super(
            facade.memberPage,
            facade.memberPageLoading,
            facade.memberPageSilentLoading,
            facade.memberPageError,
        )

        this.form = this.initForm()

        this.handleSearchedChanges()
        this.handleRangeChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()

        this.participantsSuggestion$ = this.facade.searchedParticipants
    }

    public ngOnInit (): void {
        this.handleIdParam()

        this.handleLoadedGroup()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualMemberPageSearched ),
            range: this.formBuilder.control( this.facade.actualMemberPageDateRange ),
            onlyVisible: this.formBuilder.control( this.facade.actualMemberPageOnlyVisible ),
            order: this.formBuilder.control( this.facade.actualMemberPageOrder === OrderEnum.ASC ),
        } )
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

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.GROUPS )) {
            return
        }
        this.subscriptions.add(
            this.route.params.subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( AppRouteEnum.GROUPS ).catch( console.error )
                }
                this.facade.fetchElement( params['id'], this.contextEventId() )
                this.facade.fetchMemberPage( params['id'], undefined, undefined, false, this.contextEventId() )
            } ),
        )
    }

    private handleLoadedGroup (): void {
        this.subscriptions.add(
            this.facade.element?.subscribe( (group: GroupModel | undefined): void => this.group.set( group ) ),
        )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.fetchMemberPage( this.group()!.id, pageEvent.offset, pageEvent.limit, false, eventId )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.facade.inputMemberPageSearch( searched ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.facade.inputMemberPageDateRange( range ),
            ),
        )
    }

    private handleOnlyVisibleChanges (): void {
        this.subscriptions.add(
            this.onlyVisible.valueChanges.subscribe( (onlyVisible: boolean | undefined): void => {
                if (onlyVisible != undefined) {
                    this.facade.selectMemberPageVisibility( onlyVisible )
                }
            } ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.facade.selectMemberPageOrder( order ? OrderEnum.ASC : OrderEnum.DESC )
                }
            } ),
        )
    }

    protected handleSearch (searched: string | undefined): void {
        this.facade.searchParticipants(
            searched,
            this.contextEventId(),
        )
    }

    protected addMembers (): void {
        this.facade.addMembersToGroup(
            this.group()!.id,
            this.addMembersParticipant?.value?.map( (item: SelectItem<ParticipantModel>): string => item.value.id ) ?? [],
            this.contextEventId(),
        ).subscribe( (): boolean => this.addMembersFormLayerOpened = false )
    }

    protected handleParticipantCreation (): void {
        this.subscriptions.add(
            this.participantFacade.handleElementCreation().subscribe( (): void => {
                this.createMemberFormLayerOpened = false
                this.facade.fetchElement( this.group()!.id, this.contextEventId() )
                this.facade.fetchMemberPage( this.group()!.id, undefined, undefined, false, this.contextEventId() )
            } ),
        )
    }

    protected get searched (): FormControl {
        return this.form.get( 'searched' ) as FormControl
    }

    protected get range (): FormControl {
        return this.form.get( 'range' ) as FormControl
    }

    protected get onlyVisible (): FormControl {
        return this.form.get( 'onlyVisible' ) as FormControl
    }

    protected get order (): FormControl {
        return this.form.get( 'order' ) as FormControl
    }

    protected get addMembersParticipant (): FormControl | undefined {
        return this.addMembersForm?.get( 'participants' ) as FormControl | undefined
    }
}

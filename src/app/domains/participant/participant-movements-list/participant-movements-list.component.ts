import { Component, OnInit, signal, WritableSignal } from '@angular/core'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { MovementModel } from '../../../shared/util-model/movement.model'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { AsyncPipe } from '@angular/common'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { DropdownModule } from 'primeng/dropdown'
import { MovementElementComponent } from '../../../shared/util-ui/movement-element/movement-element.component'
import { Params } from '@angular/router'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { Observable } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { ParticipantFacade } from '../data/state/participant.facade'
import { StringUtils } from '../../../shared/util-tool/util/string.util'
import { AppRouteEnum } from '../../../app-route.enum'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { ParticipantElementComponent } from '../../../shared/util-ui/participant-element/participant-element.component'

@Component( {
    selector: 'app-participant-movements-list',
    standalone: true,
    templateUrl: './participant-movements-list.component.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslateModule,
        InputTextModule,
        ToggleButtonModule,
        AsyncPipe,
        MessageComponent,
        DropdownModule,
        MovementElementComponent,
        Select,
        Button,
        DatePicker,
        ParticipantElementComponent,
    ],
} )
export class ParticipantMovementsListComponent extends GenericListComponent<MovementModel> implements OnInit {
    protected readonly participant: WritableSignal<ParticipantModel | undefined> = signal( undefined )
    protected readonly movementTypes$: Observable<SelectItem<string>[]>

    public constructor (private readonly facade: ParticipantFacade) {
        super(
            facade.participantMovementsPage,
            facade.participantMovementsPageLoading,
            facade.participantMovementsPageSilentLoading,
            facade.participantMovementsPageError,
        )

        this.form = this.initForm()
        this.movementTypes$ = facade.movementTypesMetadata

        this.handleSearchedChanges()
        this.handleTypeChanges()
        this.handleRangeChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()
    }

    public ngOnInit (): void {
        this.facade.fetchParticipantMovementTypes()
        this.handleIdParam()

        this.handleLoadedParticipant()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualParticipantMovementsPageSearchParam ),
            type: this.formBuilder.control( this.facade.actualParticipantMovementsPageMovementTypeParam ),
            range: this.formBuilder.control( this.facade.actualParticipantMovementsPageDateRangeParam ),
            onlyVisible: this.formBuilder.control( this.facade.actualParticipantMovementsPageOnlyVisibleParam ),
            order: this.formBuilder.control( this.facade.actualParticipantMovementsPageOrderParam === OrderEnum.DESC ),
        } )
    }

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.PARTICIPANTS )) {
            return
        }
        this.subscriptions.add(
            this.route.params.subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( AppRouteEnum.PARTICIPANTS ).catch( console.error )
                }
                this.facade.fetchParticipant( params['id'], this.contextEventId() )
                this.facade.fetchParticipantMovementsPage(
                    params['id'],
                    undefined,
                    undefined,
                    false,
                    this.contextEventId(),
                )
            } ),
        )
    }

    private handleLoadedParticipant (): void {
        this.subscriptions.add(
            this.facade.participant?.subscribe( (group: ParticipantModel | undefined): void => this.participant.set(
                group ) ),
        )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.fetchParticipantMovementsPage(
            this.participant()!.id, pageEvent.offset, pageEvent.limit, false, eventId,
        )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.facade.inputParticipantMovementsPageSearch( searched ),
            ),
        )
    }

    private handleTypeChanges (): void {
        this.subscriptions.add(
            this.type.valueChanges.subscribe( (type: string | undefined): void =>
                this.facade.selectParticipantMovementsPageType( type ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.facade.inputParticipantMovementsPageDateRange( range ),
            ),
        )
    }

    private handleOnlyVisibleChanges (): void {
        this.subscriptions.add(
            this.onlyVisible.valueChanges.subscribe( (onlyVisible: boolean | undefined): void => {
                if (onlyVisible != undefined) {
                    this.facade.selectParticipantMovementsPageVisibility( onlyVisible )
                }
            } ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.facade.selectParticipantMovementsPageOrder( order ? OrderEnum.DESC : OrderEnum.ASC )
                }
            } ),
        )
    }

    protected get searched (): FormControl {
        return this.form.get( 'searched' ) as FormControl
    }

    protected get type (): FormControl {
        return this.form.get( 'type' ) as FormControl
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
}

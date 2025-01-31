import { Component, OnInit } from '@angular/core'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { MovementModel } from '../data/model/movement.model'
import { MovementFacade } from '../data/state/movement.facade'
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
import { MovementElementComponent } from '../movement-element/movement-element.component'
import { RouterLink } from '@angular/router'
import { MovementRoutesEnum } from '../movement-routes.enum'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { Observable } from 'rxjs'
import { SelectItem } from 'primeng/api'

@Component( {
    selector: 'app-movements-list',
    standalone: true,
    templateUrl: './movements-list.component.html',
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
        RouterLink,
        Select,
        Button,
        DatePicker,
    ],
} )
export class MovementsListComponent extends GenericListComponent<MovementModel> implements OnInit {
    protected readonly MovementRoutesEnum: typeof MovementRoutesEnum = MovementRoutesEnum
    protected readonly movementTypes$: Observable<SelectItem<string>[]>

    public constructor (private readonly facade: MovementFacade) {
        super(
            facade.page,
            facade.pageLoading,
            facade.pageSilentLoading,
            facade.pageError,
        )

        this.form = this.initForm()
        this.movementTypes$ = facade.movementTypes

        this.handleSearchedChanges()
        this.handleTypeChanges()
        this.handleRangeChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()
    }

    public ngOnInit (): void {
        this.facade.fetchMovementTypes( this.contextEventId() )
        this.facade.fetchElementPage( undefined, undefined, false, this.contextEventId() )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualPageSearched ),
            type: this.formBuilder.control( this.facade.actualPageType ),
            range: this.formBuilder.control( this.facade.actualPageDateRange ),
            onlyVisible: this.formBuilder.control( this.facade.actualPageOnlyVisible ),
            order: this.formBuilder.control( this.facade.actualPageOrder === OrderEnum.DESC ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.fetchElementPage( pageEvent.offset, pageEvent.limit, false, eventId )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.facade.inputPageSearch( searched ),
            ),
        )
    }

    private handleTypeChanges (): void {
        this.subscriptions.add(
            this.type.valueChanges.subscribe( (type: string | undefined): void =>
                this.facade.selectPageType( type ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.facade.inputPageDateRange( range ),
            ),
        )
    }

    private handleOnlyVisibleChanges (): void {
        this.subscriptions.add(
            this.onlyVisible.valueChanges.subscribe( (onlyVisible: boolean | undefined): void => {
                if (onlyVisible != undefined) {
                    this.facade.selectPageVisibility( onlyVisible )
                }
            } ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.facade.selectPageOrder( order ? OrderEnum.DESC : OrderEnum.ASC )
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

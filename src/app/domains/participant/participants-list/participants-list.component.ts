import { Component, OnInit } from '@angular/core'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { ParticipantFacade } from '../data/state/participant.facade'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { DropdownModule } from 'primeng/dropdown'
import { CalendarModule } from 'primeng/calendar'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { AsyncPipe } from '@angular/common'
import { ParticipantElementComponent } from '../../../shared/util-ui/participant-element/participant-element.component'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { RouterLink } from '@angular/router'
import { ParticipantRoutesEnum } from '../participant-routes.enum'

@Component( {
    selector: 'app-participants-list',
    standalone: true,
    templateUrl: './participants-list.component.html',
    styleUrl: './participants-list.component.scss',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslateModule,
        InputTextModule,
        DropdownModule,
        CalendarModule,
        ToggleButtonModule,
        AsyncPipe,
        ParticipantElementComponent,
        MessageComponent,
        RouterLink,
    ],
} )
export class ParticipantsListComponent extends GenericListComponent<ParticipantModel> implements OnInit {
    protected readonly ParticipantRoutesEnum: typeof ParticipantRoutesEnum = ParticipantRoutesEnum

    public constructor (private readonly facade: ParticipantFacade) {
        super(
            facade.page,
            facade.pageLoading,
            facade.pageSilentLoading,
            facade.pageError,
        )

        this.form = this.initForm()

        this.handleSearchedChanges()
        this.handleRangeChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()
    }

    public ngOnInit (): void {
        this.facade.fetchElementPage( undefined, undefined, false, this.contextEventId() )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualPageSearched ),
            range: this.formBuilder.control( this.facade.actualPageDateRange ),
            onlyVisible: this.formBuilder.control( this.facade.actualPageOnlyVisible ),
            order: this.formBuilder.control( this.facade.actualPageOrder === OrderEnum.ASC ),
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
                    this.facade.selectPageOrder( order ? OrderEnum.ASC : OrderEnum.DESC )
                }
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
}

import { Component, OnInit } from '@angular/core'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { GroupModel } from '../../../shared/util-model/model/group.model'
import { GroupRoutesEnum } from '../group-routes.enum'
import { GroupFacade } from '../data/state/group.facade'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { AsyncPipe } from '@angular/common'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { InputText } from 'primeng/inputtext'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { ToggleButton } from 'primeng/togglebutton'
import { TranslatePipe } from '@ngx-translate/core'
import { RouterLink } from '@angular/router'
import { GroupElementComponent } from '../group-element/group-element.component'

@Component( {
    selector: 'app-group-list',
    standalone: true,
    imports: [
        AsyncPipe,
        Button,
        DatePicker,
        InputText,
        ListComponent,
        MessageComponent,
        ReactiveFormsModule,
        RegistryTemplateDirective,
        ToggleButton,
        TranslatePipe,
        RouterLink,
        GroupElementComponent,
    ],
    templateUrl: './group-list.component.html',
} )
export class GroupListComponent extends GenericListComponent<GroupModel> implements OnInit {
    protected readonly GroupRoutesEnum: typeof GroupRoutesEnum = GroupRoutesEnum

    public constructor (private readonly facade: GroupFacade) {
        super(
            facade.groupsPage,
            facade.groupsPageLoading,
            facade.groupsPageSilentLoading,
            facade.groupsPageError,
        )

        this.form = this.initForm()

        this.handleSearchedChanges()
        this.handleRangeChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()
    }

    public ngOnInit (): void {
        this.facade.fetchGroupsPage( undefined, undefined, false, this.contextEventId() )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualGroupsPageSearchParam ),
            range: this.formBuilder.control( this.facade.actualGroupsPageDateRangeParam ),
            onlyVisible: this.formBuilder.control( this.facade.actualGroupsPageOnlyVisibleParam ),
            order: this.formBuilder.control( this.facade.actualGroupsPageOrderParam === OrderEnum.ASC ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.fetchGroupsPage( pageEvent.offset, pageEvent.limit, false, eventId )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.facade.inputGroupsPageSearch( searched ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.facade.inputGroupsPageDateRange( range ),
            ),
        )
    }

    private handleOnlyVisibleChanges (): void {
        this.subscriptions.add(
            this.onlyVisible.valueChanges.subscribe( (onlyVisible: boolean | undefined): void => {
                if (onlyVisible != undefined) {
                    this.facade.selectGroupsPageVisibility( onlyVisible )
                }
            } ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.facade.selectGroupsPageOrder( order ? OrderEnum.ASC : OrderEnum.DESC )
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

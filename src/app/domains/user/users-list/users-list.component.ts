import { Component } from '@angular/core'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { UserModel } from '../../../shared/util-model/model/user.model'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { UserFacade } from '../data/state/user.facade'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { Button } from 'primeng/button'
import { AsyncPipe } from '@angular/common'
import { UserElementComponent } from '../user-element/user-element.component'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'

@Component( {
    selector: 'app-users-list',
    standalone: true,
    imports: [
        ListComponent,
        ReactiveFormsModule,
        RegistryTemplateDirective,
        TranslateModule,
        InputTextModule,
        ToggleButtonModule,
        Button,
        AsyncPipe,
        UserElementComponent,
        MessageComponent,
    ],
    templateUrl: './users-list.component.html',
} )
export class UsersListComponent extends GenericListComponent<UserModel> {
    public constructor (private readonly facade: UserFacade) {
        super(
            facade.usersPage,
            facade.usersPageLoading,
            facade.usersPageSilentLoading,
            facade.usersPageError,
        )

        this.facade.fetchAssignableRoles()
        this.facade.fetchUsersPage( undefined, undefined, false )

        this.form = this.initForm()

        this.handleSearchedChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualUsersPageSearchParam ),
            onlyVisible: this.formBuilder.control( this.facade.actualUsersPageOnlyVisibleParam ),
            order: this.formBuilder.control( this.facade.actualUsersPageOrderParam === OrderEnum.ASC ),
        } )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.facade.inputUsersPageSearch( searched ),
            ),
        )
    }

    private handleOnlyVisibleChanges (): void {
        this.subscriptions.add(
            this.onlyVisible.valueChanges.subscribe( (onlyVisible: boolean | undefined): void => {
                if (onlyVisible != undefined) {
                    this.facade.selectUsersPageVisibility( onlyVisible )
                }
            } ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.facade.selectUsersPageOrder( order ? OrderEnum.ASC : OrderEnum.DESC )
                }
            } ),
        )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.fetchUsersPage( pageEvent.offset, pageEvent.limit, false )
    }

    protected get searched (): FormControl {
        return this.form.get( 'searched' ) as FormControl
    }

    protected get onlyVisible (): FormControl {
        return this.form.get( 'onlyVisible' ) as FormControl
    }

    protected get order (): FormControl {
        return this.form.get( 'order' ) as FormControl
    }
}

import { Component, inject} from '@angular/core'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {UserFacade} from '@pages/users/data/state/user.facade'
import {ListComponent} from '@shared/ui/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslatePipe} from '@ngx-translate/core'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {Button} from 'primeng/button'
import {UserElementComponent} from '@pages/users/user-element/user-element.component'
import {Select} from 'primeng/select'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'

@Component({
    selector: 'app-users-list',
    imports: [
        ListComponent,
        ReactiveFormsModule,
        RegistryTemplateDirective,
        TranslatePipe,
        InputTextModule,
        ToggleButtonModule,
        Button,
        UserElementComponent,
        Select,
    ],
    templateUrl: './users-list.page.html',
})
export class UsersListPage extends GenericListComponent {
    protected readonly facade: UserFacade = inject(UserFacade)

    public constructor() {
        super()

        this.form = this.initForm()

        this.facade.fetchUsersPage(undefined, undefined, false)
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            textSearched: this.formBuilder.control(this.facade.usersPageTextSearchedParam()),
            visibilitySearched: this.formBuilder.control(this.facade.actualUsersPageVisibilitySearchedParam()),
        })
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(this.textSearched.value, this.visibilitySearched.value)
        this.facade.fetchUsersPage(pageEvent.pageNumber, pageEvent.pageSize, false)
    }

    protected get textSearched(): FormControl {
        return this.form.get('textSearched') as FormControl
    }

    protected get visibilitySearched(): FormControl {
        return this.form.get('visibilitySearched') as FormControl
    }
}

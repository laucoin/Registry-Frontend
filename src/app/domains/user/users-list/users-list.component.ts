import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { UserFacade } from '../data/state/user.facade'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { Button } from 'primeng/button'
import { UserElementComponent } from '../user-element/user-element.component'
import { Select } from 'primeng/select'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'

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
        UserElementComponent,
        Select,
    ],
    templateUrl: './users-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class UsersListComponent extends GenericListComponent {
    protected readonly facade: UserFacade = inject( UserFacade )

    public constructor () {
        super()

        this.form = this.initForm()

        this.facade.fetchUsersPage( undefined, undefined, false )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.facade.usersPageTextSearchedParam() ),
            visibilitySearched: this.formBuilder.control( this.facade.actualUsersPageVisibilitySearchedParam() ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters( this.textSearched.value, this.visibilitySearched.value )
        this.facade.fetchUsersPage( pageEvent.pageNumber, pageEvent.pageSize, false )
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get visibilitySearched (): FormControl {
        return this.form.get( 'visibilitySearched' ) as FormControl
    }
}

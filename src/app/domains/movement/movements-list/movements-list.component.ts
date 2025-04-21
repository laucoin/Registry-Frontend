import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { MovementFacade } from '../data/state/movement.facade'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { DropdownModule } from 'primeng/dropdown'
import { MovementElementComponent } from '../../../shared/util-ui/movement-element/movement-element.component'
import { RouterLink } from '@angular/router'
import { MovementRoutesEnum } from '../movement-routes.enum'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'

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
        DropdownModule,
        MovementElementComponent,
        RouterLink,
        Select,
        Button,
        DatePicker,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class MovementsListComponent extends GenericListComponent {
    protected readonly facade: MovementFacade = inject( MovementFacade )

    protected readonly MovementRoutesEnum: typeof MovementRoutesEnum = MovementRoutesEnum

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            typeSearched: this.formBuilder.control( this.facade.movementsPageTypeSearchedParam() ),
            startDateTimeSearched: this.formBuilder.control( this.facade.movementsPageStartDateTimeSearchedParam() ),
            endDateTimeSearched: this.formBuilder.control( this.facade.movementsPageEndDateTimeSearchedParam() ),
            visibilitySearched: this.formBuilder.control( this.facade.movementsPageVisibilitySearchedParam() ),
        } )
    }

    protected loadData (): void {
        const eventId: string | undefined = this.route.snapshot.params['eventId']
        if (!eventId) return
        this.facade.fetchMovementsPage( undefined, undefined, false, eventId )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.inputPageSearchParameters(
            this.typeSearched.value,
            this.startDateTimeSearched.value,
            this.endDateTimeSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchMovementsPage( pageEvent.pageNumber, pageEvent.pageSize, false, eventId )
    }

    protected get typeSearched (): FormControl {
        return this.form.get( 'typeSearched' ) as FormControl
    }

    protected get startDateTimeSearched (): FormControl {
        return this.form.get( 'startDateTimeSearched' ) as FormControl
    }

    protected get endDateTimeSearched (): FormControl {
        return this.form.get( 'endDateTimeSearched' ) as FormControl
    }

    protected get visibilitySearched (): FormControl {
        return this.form.get( 'visibilitySearched' ) as FormControl
    }
}

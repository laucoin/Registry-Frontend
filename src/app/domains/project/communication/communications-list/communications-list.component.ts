import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { GenericListComponent } from '../../../../shared/util-tool/component/generic-list.component'
import { CommunicationFacade } from '../data/state/communication.facade'
import { CommunicationRoutesEnum } from '../communication-routes.enum'
import { PageEventModel } from '../../../../shared/util-model/model/page-event.model'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { ListComponent } from '../../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../../shared/util-tool/directive/registry-template.directive'
import { DatePicker } from 'primeng/datepicker'
import { Select } from 'primeng/select'
import { InputText } from 'primeng/inputtext'
import { TranslatePipe } from '@ngx-translate/core'
import { Button } from 'primeng/button'
import { RouterLink } from '@angular/router'
import { CommunicationElementComponent } from '../communication-element/communication-element.component'

@Component( {
    selector: 'app-communications-list',
    standalone: true,
    imports: [
        ListComponent,
        ReactiveFormsModule,
        RegistryTemplateDirective,
        DatePicker,
        Select,
        InputText,
        TranslatePipe,
        Button,
        RouterLink,
        CommunicationElementComponent,
    ],
    templateUrl: './communications-list.component.html',
    styleUrl: './communications-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class CommunicationsListComponent extends GenericListComponent {
    protected readonly facade: CommunicationFacade = inject( CommunicationFacade )

    protected readonly CommunicationRoutesEnum: typeof CommunicationRoutesEnum = CommunicationRoutesEnum

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.facade.communicationsPageTextSearchedParam() ),
            visibilitySearched: this.formBuilder.control( this.facade.communicationsPageVisibilitySearchedParam() ),
            startDateTimeSearched: this.formBuilder.control( this.facade.communicationsPageStartDateTimeSearchedParam() ),
            endDateTimeSearched: this.formBuilder.control( this.facade.communicationsPageEndDateTimeSearchedParam() ),
        } )
    }

    protected loadData (): void {
        this.facade.fetchCommunicationsPage( undefined, undefined, false )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.visibilitySearched.value,
            this.startDateTimeSearched.value,
            this.endDateTimeSearched.value,
        )
        this.facade.fetchCommunicationsPage( pageEvent.pageNumber, pageEvent.pageSize, false )
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get visibilitySearched (): FormControl {
        return this.form.get( 'visibilitySearched' ) as FormControl
    }

    protected get startDateTimeSearched (): FormControl {
        return this.form.get( 'startDateTimeSearched' ) as FormControl
    }

    protected get endDateTimeSearched (): FormControl {
        return this.form.get( 'endDateTimeSearched' ) as FormControl
    }
}

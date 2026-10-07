import { Component, inject} from '@angular/core'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {AlertFacade} from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {InputText} from 'primeng/inputtext'
import {ListComponent} from '@shared/ui/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {Select} from 'primeng/select'
import {TranslatePipe} from '@ngx-translate/core'
import {AlertElementComponent} from '@shared/ui/alert-element/alert-element.component'

@Component({
    selector: 'app-alerts-list',
    imports: [
        Button,
        DatePicker,
        InputText,
        ListComponent,
        ReactiveFormsModule,
        RegistryTemplateDirective,
        Select,
        TranslatePipe,
        AlertElementComponent,
    ],
    templateUrl: './alerts-list.page.html',
    styleUrl: './alerts-list.page.scss',
})
export class AlertsListPage extends GenericListComponent {
    protected readonly facade: AlertFacade = inject(AlertFacade)

    public constructor() {
        super()

        this.form = this.initForm()

        this.loadData()
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            textSearched: this.formBuilder.control(this.facade.alertsPageTextSearchedParam()),
            statusSearched: this.formBuilder.control(this.facade.alertsPageStatusSearchedParam()),
            visibilitySearched: this.formBuilder.control(this.facade.alertsPageVisibilitySearchedParam()),
            startDateTimeSearched: this.formBuilder.control(this.facade.alertsPageStartDateTimeSearchedParam()),
            endDateTimeSearched: this.formBuilder.control(this.facade.alertsPageEndDateTimeSearchedParam()),
        })
    }

    protected loadData(): void {
        this.facade.fetchAlertsPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.statusSearched.value,
            this.visibilitySearched.value,
            this.startDateTimeSearched.value,
            this.endDateTimeSearched.value,
        )
        this.facade.fetchAlertsPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

    protected get textSearched(): FormControl {
        return this.form.get('textSearched') as FormControl
    }

    protected get statusSearched(): FormControl {
        return this.form.get('statusSearched') as FormControl
    }

    protected get visibilitySearched(): FormControl {
        return this.form.get('visibilitySearched') as FormControl
    }

    protected get startDateTimeSearched(): FormControl {
        return this.form.get('startDateTimeSearched') as FormControl
    }

    protected get endDateTimeSearched(): FormControl {
        return this.form.get('endDateTimeSearched') as FormControl
    }
}

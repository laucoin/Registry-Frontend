import {ChangeDetectionStrategy, Component, inject} from '@angular/core'
import {GenericListComponent} from '../../../../shared/util-tool/component/generic-list.component'
import {AlertFacade} from '../data/state/alert.facade'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '../../../../shared/util-model/model/page-event.model'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {InputText} from 'primeng/inputtext'
import {ListComponent} from '../../../../shared/util-ui/list/list.component'
import {RegistryTemplateDirective} from '../../../../shared/util-tool/directive/registry-template.directive'
import {Select} from 'primeng/select'
import {TranslatePipe} from '@ngx-translate/core'
import {AlertElementComponent} from '../../../../shared/util-ui/alert-element/alert-element.component'

@Component({
    selector: 'app-alerts-list',
    standalone: true,
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
    templateUrl: './alerts-list.component.html',
    styleUrl: './alerts-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsListComponent extends GenericListComponent {
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
        this.facade.fetchAlertsPage(undefined, undefined, false)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.statusSearched.value,
            this.visibilitySearched.value,
            this.startDateTimeSearched.value,
            this.endDateTimeSearched.value,
        )
        this.facade.fetchAlertsPage(pageEvent.pageNumber, pageEvent.pageSize, false)
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

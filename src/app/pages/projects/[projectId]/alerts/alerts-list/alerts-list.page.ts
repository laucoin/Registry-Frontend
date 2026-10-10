import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { AlertsListSearchModel, toAlertsListSearchModel, toAlertsListSearchParams } from './alerts-list.search'
import { Component, inject, signal, WritableSignal } from '@angular/core'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'
import {AlertFacade} from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {InputText} from 'primeng/inputtext'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {Select} from 'primeng/select'
import {TranslocoPipe} from '@jsverse/transloco'
import {AlertElementComponent} from '@shared/ui/domain/alert-element/alert-element.component'

/**
 * Purpose: Page listing the alerts with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-alerts-list',
    imports: [
        Button,
        DatePicker,
        InputText,
        ListComponent,
        FormField,
        RegistryTemplateDirective,
        Select,
        TranslocoPipe,
        AlertElementComponent,
    ],
    templateUrl: './alerts-list.page.html',
})
export class AlertsListPage extends GenericListComponent {
    protected readonly facade: AlertFacade = inject(AlertFacade)

    protected readonly model: WritableSignal<AlertsListSearchModel> = signal( toAlertsListSearchModel( {
        textSearched: this.facade.alertsPageTextSearchedParam(),
        statusSearched: this.facade.alertsPageStatusSearchedParam(),
        visibilitySearched: this.facade.alertsPageVisibilitySearchedParam(),
        startDateTimeSearched: this.facade.alertsPageStartDateTimeSearchedParam(),
        endDateTimeSearched: this.facade.alertsPageEndDateTimeSearchedParam(),
    } ) )
    protected readonly form: FieldTree<AlertsListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.loadData()
    }

    protected loadData(): void {
        this.facade.fetchAlertsPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toAlertsListSearchParams> = toAlertsListSearchParams( this.model() )
        this.facade.inputPageSearchParameters(
            search.textSearched,
            search.statusSearched,
            search.visibilitySearched,
            search.startDateTimeSearched,
            search.endDateTimeSearched,
        )
        this.facade.fetchAlertsPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

}

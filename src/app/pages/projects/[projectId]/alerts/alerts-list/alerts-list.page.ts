import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/list-item'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import {
    AlertsListSearchModel,
    toAlertsListSearchModel,
    toAlertsListSearchParams,
} from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.search'
import { ProjectEyebrowDirective } from '@shared/directives/project-eyebrow.directive'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { AlertElementComponent } from '@shared/ui/domain/alert-element/alert-element.component'

/**
 * Purpose: Page listing the alerts of the selected project with search and a "load more" trigger.
 * Scope: Binds the list component to the alert facade and owns the search form; each row is an alert element.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-alerts-list',
    imports: [
        ProjectEyebrowDirective,
        ListComponent,
        AlertElementComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        BooleanChoicePipe,
        TranslocoPipe,
        FormField,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './alerts-list.page.html',
})
export class AlertsListPage {
    protected readonly facade: AlertFacade = inject(AlertFacade)

    protected readonly activeFilters: Signal<number> = computed((): number => [
        this.facade.alertsPageTextSearchedParam() !== undefined,
        this.facade.alertsPageStatusSearchedParam() !== undefined,
        this.facade.alertsPageVisibilitySearchedParam() !== undefined,
        this.facade.alertsPageStartDateTimeSearchedParam() !== undefined,
        this.facade.alertsPageEndDateTimeSearchedParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<AlertsListSearchModel> = signal(toAlertsListSearchModel({
        q: this.facade.alertsPageTextSearchedParam(),
        status: this.facade.alertsPageStatusSearchedParam(),
        isVisible: this.facade.alertsPageVisibilitySearchedParam(),
        from: this.facade.alertsPageStartDateTimeSearchedParam(),
        to: this.facade.alertsPageEndDateTimeSearchedParam(),
    }))
    protected readonly form: FieldTree<AlertsListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.facade.fetchAlertsPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toAlertsListSearchParams> = toAlertsListSearchParams(this.model())
        this.facade.inputPageSearchParameters(
            search.q,
            search.status,
            search.isVisible,
            search.from,
            search.to,
        )
        this.facade.fetchAlertsPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ q: '', status: '', isVisible: '', from: null, to: null })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchAlertsPage(pageEvent.page, pageEvent.size)
    }
}

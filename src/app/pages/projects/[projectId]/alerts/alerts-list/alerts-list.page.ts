import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { FieldTree, FormField } from '@angular/forms/signals'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/format-duration'
import '@sgdf/ui/format-number'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/list-item'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import '@sgdf/ui/stat'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import {
    AlertsListSearchModel,
    toAlertsListSearchModel,
    toAlertsListSearchParams,
} from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { injectSearchQuery, SearchQuery, SearchQuerySchema } from '@shared/helpers/search/search-query'
import { DurationHelper } from '@shared/helpers/duration.helper'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { AlertStatisticsModel } from '@shared/models/model/alert-statistics.model'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { AlertElementComponent } from '@shared/ui/domain/alert-element/alert-element.component'

const ALERTS_LIST_DEFAULTS: AlertsListSearchModel = toAlertsListSearchModel({ q: undefined, status: undefined, isVisible: undefined, from: undefined, to: undefined })
const ALERTS_LIST_QUERY_SCHEMA: SearchQuerySchema<AlertsListSearchModel> = { q: 'text', status: 'text', isVisible: 'choice', from: 'date', to: 'date' }

/**
 * Purpose: Page listant les alertes du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des alertes et possède le formulaire de recherche ; chaque ligne est un élément d'alerte. Affiche au-dessus les statistiques des alertes (temps moyen de résolution et taux d'alertes réelles).
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
    selector: 'app-alerts-list',
    imports: [
        IfProjectAuthorityDirective,
        ListComponent,
        SectionErrorComponent,
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
    protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_RESTORE

    protected readonly facade: AlertFacade = inject(AlertFacade)

    protected readonly activeFilters: Signal<number> = computed((): number => [
        this.facade.alertsPageQueryParam() !== undefined,
        this.facade.alertsPageStatusParam() !== undefined,
        this.facade.alertsPageIsVisibleParam() !== undefined,
        this.facade.alertsPageFromParam() !== undefined,
        this.facade.alertsPageToParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly resolutionDuration: Signal<string | undefined> = computed((): string | undefined => {
        const seconds: number | undefined = this.facade.alertStatistics()?.averageResolutionSeconds

        return seconds === undefined ? undefined : DurationHelper.toIsoDuration(seconds)
    })

    protected readonly closedAlertsCount: Signal<number> = computed((): number => {
        const statistics: AlertStatisticsModel | undefined = this.facade.alertStatistics()

        return (statistics?.resolvedCount ?? 0) + (statistics?.canceledCount ?? 0)
    })

    protected readonly model: WritableSignal<AlertsListSearchModel> = signal(ALERTS_LIST_DEFAULTS)
    protected readonly form: FieldTree<AlertsListSearchModel> = createSearchForm(this.model)
    private readonly searchQuery: SearchQuery = injectSearchQuery({
        schema: ALERTS_LIST_QUERY_SCHEMA,
        defaults: ALERTS_LIST_DEFAULTS,
        model: this.model,
        apply: (model: AlertsListSearchModel): void => {
            this.inputSearch(model)
            this.facade.fetchAlertsPage(undefined, undefined)
        },
    })

    public constructor() {
        this.facade.fetchAlertStatistics()
    }

    protected search(): void {
        this.inputSearch(this.model())
        this.facade.fetchAlertsPage(0, undefined)
        this.searchQuery.write()
    }

    protected resetFilters(): void {
        this.model.set(ALERTS_LIST_DEFAULTS)
        this.search()
    }

    private inputSearch(model: AlertsListSearchModel): void {
        const search: ReturnType<typeof toAlertsListSearchParams> = toAlertsListSearchParams(model)
        this.facade.inputPageSearchParameters(
            search.q,
            search.status,
            search.isVisible,
            search.from,
            search.to,
        )
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchAlertsPage(pageEvent.page, pageEvent.size)
    }
}

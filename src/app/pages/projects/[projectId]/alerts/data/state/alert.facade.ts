import { computed, Injectable, Signal, inject } from '@angular/core'
import { PageModel } from '@shared/models/model/page.model'
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { DateHelper } from '@shared/helpers/date.helper'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/rx.helper'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { Observable, tap } from 'rxjs'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { AlertDto } from '@pages/projects/[projectId]/alerts/data/dto/alert.dto'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'


@Injectable()
export class AlertFacade extends GenericProjectElementFacade {
    private readonly store: InstanceType<typeof AlertStore> = inject( AlertStore )

    private readonly api: AlertApi = inject( AlertApi )

    public readonly alertsPage: Signal<PageModel<AlertModel> | undefined> = this.store.alerts.element

    public readonly alertsPageLoading: Signal<boolean> = this.store.alerts.loading

    public readonly alertsPageSilentLoading: Signal<boolean> = this.store.alerts.silentLoading

    public readonly alertsPageError: Signal<ToastMessageOptions | undefined> = this.store.alerts.error

    private readonly alertsPageResetSearch: Signal<boolean> = this.store.alerts.params.resetSearch

    public readonly alertsPageTextSearchedParam: Signal<string | undefined> = this.store.alerts.params.textSearched

    public readonly alertsPageStatusSearchedParam: Signal<AlertStatusEnum | undefined> = this.store.alerts.params.statusSearched

    public readonly alertsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.alerts.params.visibilitySearched

    public readonly alertsPageStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.alerts.params.startDateTimeSearched() ),
        )

    public readonly alertsPageEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.alerts.params.endDateTimeSearched() ),
        )

    public readonly alertCommunicationsPage: Signal<PageModel<CommunicationModel> | undefined> = this.store.communications.element

    public readonly alertCommunicationsPageLoading: Signal<boolean> = this.store.communications.loading

    public readonly alertCommunicationsPageSilentLoading: Signal<boolean> = this.store.communications.silentLoading

    public readonly alertCommunicationsPageError: Signal<ToastMessageOptions | undefined> = this.store.communications.error

    private readonly alertCommunicationsPageResetSearch: Signal<boolean> = this.store.communications.params.resetSearch

    public readonly alertCommunicationsPageTextSearchedParam: Signal<string | undefined> = this.store.communications.params.textSearched

    public readonly alertCommunicationsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.communications.params.visibilitySearched

    public readonly alertCommunicationsPageStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.communications.params.startDateTimeSearched() ),
        )

    public readonly alertCommunicationsPageEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.communications.params.endDateTimeSearched() ),
        )

    public readonly visibilitiesMetadata: Signal<SelectItem<boolean | undefined>[]> = computed( () =>
            this.store.metadata.visibilities().map( (status: SelectItem<boolean | undefined>) => ({
                ...status,
                label: this.translateService.translate( status.label! ),
            }) ),
        )

    public readonly alertStatusMetadata: Signal<SelectItem<AlertStatusEnum | undefined>[]> = this.store.metadata.status

    public fetchAlertsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.alertsPageResetSearch() ? 0 : pageNumber
        this.store.fetchAlertsPage( { projectId: this.selectedProjectId(), pageNumber: index, pageSize: pageSize } )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        statusSearched: AlertStatusEnum | undefined,
        visibilitySearched: boolean | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.alertsPageTextSearchedParam() != textSearched
                                     || this.alertsPageStatusSearchedParam() != statusSearched
                                     || this.alertsPageVisibilitySearchedParam() != visibilitySearched
                                     || this.alertsPageStartDateTimeSearchedParam() != startDateTimeSearched?.toISOString()
                                     || this.alertsPageEndDateTimeSearchedParam() != endDateTimeSearched?.toISOString()

        if (resetSearch) {
            this.store.updateAlertsPageSearchParams( {
                resetSearch: resetSearch,
                textSearched: textSearched,
                statusSearched: statusSearched,
                visibilitySearched: visibilitySearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } )
        }
    }

    public fetchAlertCommunicationsPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.alertsPageResetSearch() ? 0 : pageNumber
        this.store.fetchAlertCommunicationsPage( { projectId: this.selectedProjectId(), id: id, pageNumber: index, pageSize: pageSize } )
    }

    public inputCommunicationsPageSearchParameters (
        textSearched: string | undefined,
        visibilitySearched: boolean | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.alertCommunicationsPageTextSearchedParam() != textSearched
                                     || this.alertCommunicationsPageVisibilitySearchedParam() != visibilitySearched
                                     || this.alertCommunicationsPageStartDateTimeSearchedParam() != startDateTimeSearched?.toISOString()
                                     || this.alertCommunicationsPageEndDateTimeSearchedParam() != endDateTimeSearched?.toISOString()

        if (resetSearch) {
            this.store.updateAlertCommunicationsPageSearchParams( {
                resetSearch: resetSearch,
                textSearched: textSearched,
                visibilitySearched: visibilitySearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } )
        }
    }

    public handleAlertFirstPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'alert', 'create', 'delete' )
    }

    public handleAlertCurrentPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'alert', 'update', 'disable', 'enable' )
    }

    public handleAlertCreation (): Observable<unknown> {
        return this.commandEvents.on( 'alert', 'create' )
    }

    public handleAlertChange (): Observable<unknown> {
        return this.commandEvents.on( 'alert', 'create', 'update', 'status', 'disable', 'enable', 'delete' )
    }

    public fetchAlert (id: string): Observable<AlertModel> {
        return this.api.findAlertById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
        )
    }

    public createAlert (alert: AlertDto): Observable<AlertModel> {
        return this.api.createAlert( this.selectedProjectId(), alert ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (created: AlertModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateAlert (id: string, alert: AlertDto): Observable<AlertModel> {
        return this.api.updateAlertById( this.selectedProjectId(), id, alert ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: AlertModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableAlert (id: string): Observable<AlertModel> {
        return this.api.disableAlertById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (disabled: AlertModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableAlert (id: string): Observable<AlertModel> {
        return this.api.enableAlertById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (enabled: AlertModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteAlert (alert: AlertModel): Observable<void> {
        return this.api.deleteAlertById( undefined, alert.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', alert ) ),
        )
    }

    public updateAlertStatus (id: string, status: AlertStatusEnum): Observable<AlertModel> {
        return this.api.updateAlertStatusById( this.selectedProjectId(), id, status ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (updated: AlertModel): void => this.onCommandSuccess( 'status', updated ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, alert: AlertModel): void {
        this.onCommandSucceeded( 'alert', command, 'alerts.notifications', 'pi pi-sort-alt', { title: alert?.title, status: alert?.status?.label } )

        const page: PageModel<AlertModel> | undefined = this.alertsPage()
        this.fetchAlertsPage( page?.pageNumber, page?.pageSize )
    }
}

import { computed, Injectable, Signal, inject } from '@angular/core'
import { PageModel } from '@shared/models/model/page.model'
import { AlertState } from '@pages/projects/[projectId]/alerts/data/state/alert.state'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { DateUtil } from '@shared/helpers/util/date.util'
import { AlertService } from '@pages/projects/[projectId]/movements/data/state/alert.service'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/util/rx.util'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { Observable, tap } from 'rxjs'
import {
    FetchAlertCommunicationsPage,
    FetchAlertsPage,
    FetchAlertStatus,
    StartAlertCommunicationsPageLoader,
    StartAlertsPageLoader,
    StopAlertCommunicationsPageLoader,
    StopAlertsPageLoader,
    UpdateAlertCommunicationsPageSearchParams,
    UpdateAlertsPageSearchParams,
} from '@pages/projects/[projectId]/alerts/data/state/alert.action'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { AlertDto } from '@pages/projects/[projectId]/alerts/data/dto/alert.dto'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'


@Injectable()
export class AlertFacade extends GenericProjectElementFacade {
    private readonly service: AlertService = inject( AlertService )

    public get alertsPage (): Signal<PageModel<AlertModel> | undefined> {
        return this.ngStore.selectSignal( AlertState.alertsPage )
    }

    public get alertsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( AlertState.alertsPageLoading )
    }

    public get alertsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( AlertState.alertsPageSilentLoading )
    }

    public get alertsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( AlertState.alertsPageError )
    }

    private get alertsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( AlertState.alertsPageResetSearch )
    }

    public get alertsPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( AlertState.alertsPageTextSearchedParam )
    }

    public get alertsPageStatusSearchedParam (): Signal<AlertStatusEnum | undefined> {
        return this.ngStore.selectSignal( AlertState.alertsPageStatusSearchedParam )
    }

    public get alertsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( AlertState.alertsPageVisibilitySearchedParam )
    }

    public get alertsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( AlertState.alertsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get alertsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( AlertState.alertsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get alertCommunicationsPage (): Signal<PageModel<CommunicationModel> | undefined> {
        return this.ngStore.selectSignal( AlertState.alertCommunicationsPage )
    }

    public get alertCommunicationsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( AlertState.alertCommunicationsPageLoading )
    }

    public get alertCommunicationsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( AlertState.alertCommunicationsPageSilentLoading )
    }

    public get alertCommunicationsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( AlertState.alertCommunicationsPageError )
    }

    private get alertCommunicationsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( AlertState.alertCommunicationsPageResetSearch )
    }

    public get alertCommunicationsPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( AlertState.alertCommunicationsPageTextSearchedParam )
    }

    public get alertCommunicationsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( AlertState.alertCommunicationsPageVisibilitySearchedParam )
    }

    public get alertCommunicationsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( AlertState.alertCommunicationsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get alertCommunicationsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( AlertState.alertCommunicationsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( () =>
            this.ngStore.selectSignal( AlertState.visibilitiesMetadata )().map( (status: SelectItem<boolean | undefined>) => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )
    }

    public get alertStatusMetadata (): Signal<SelectItem<AlertStatusEnum | undefined>[]> {
        return this.ngStore.selectSignal( AlertState.alertStatusMetadata )
    }

    public fetchAlertStatus (): void {
        this.ngStore.dispatch( FetchAlertStatus )
    }

    public startAlertsPageLoader (): void {
        this.ngStore.dispatch( StartAlertsPageLoader )
    }

    public stopAlertsPageLoader (): void {
        this.ngStore.dispatch( StopAlertsPageLoader )
    }

    public fetchAlertsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.alertsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchAlertsPage( this.selectedProjectId(), index, pageSize, force ) )
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
            this.ngStore.dispatch( new UpdateAlertsPageSearchParams( {
                resetSearch: resetSearch,
                textSearched: textSearched,
                statusSearched: statusSearched,
                visibilitySearched: visibilitySearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public startAlertCommunicationsPageLoader (): void {
        this.ngStore.dispatch( StartAlertCommunicationsPageLoader )
    }

    public stopAlertCommunicationsPageLoader (): void {
        this.ngStore.dispatch( StopAlertCommunicationsPageLoader )
    }

    public fetchAlertCommunicationsPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.alertsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchAlertCommunicationsPage(
            this.selectedProjectId(),
            id,
            index,
            pageSize,
            force,
        ) )
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
            this.ngStore.dispatch( new UpdateAlertCommunicationsPageSearchParams( {
                resetSearch: resetSearch,
                textSearched: textSearched,
                visibilitySearched: visibilitySearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
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
        return this.service.findAlertById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
        )
    }

    public createAlert (alert: AlertDto): Observable<AlertModel> {
        return this.service.createAlert( this.selectedProjectId(), alert ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (created: AlertModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateAlert (id: string, alert: AlertDto): Observable<AlertModel> {
        return this.service.updateAlertById( this.selectedProjectId(), id, alert ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: AlertModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableAlert (id: string): Observable<AlertModel> {
        return this.service.disableAlertById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (disabled: AlertModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableAlert (id: string): Observable<AlertModel> {
        return this.service.enableAlertById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (enabled: AlertModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteAlert (alert: AlertModel): Observable<void> {
        return this.service.deleteAlertById( undefined, alert.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', alert ) ),
        )
    }

    public updateAlertStatus (id: string, status: AlertStatusEnum): Observable<AlertModel> {
        return this.service.updateAlertStatusById( this.selectedProjectId(), id, status ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (updated: AlertModel): void => this.onCommandSuccess( 'status', updated ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, alert: AlertModel): void {
        this.onCommandSucceeded( 'alert', command, 'alerts.notifications', 'pi pi-sort-alt', { title: alert?.title, status: alert?.status?.label } )

        const page: PageModel<AlertModel> | undefined = this.alertsPage()
        this.fetchAlertsPage( page?.pageNumber, page?.pageSize, true )
    }
}

import { computed, Injectable, Signal } from '@angular/core'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { AlertState } from './alert.state'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { DateUtil } from '../../../../../shared/util-tool/util/date.util'
import { Observable } from 'rxjs'
import {
    CreateAlert,
    DeleteAlert,
    DisableAlert,
    EnableAlert,
    FetchAlert,
    FetchAlertCommunicationsPage,
    FetchAlertsPage,
    FetchAlertStatus,
    ResetAlert,
    StartAlertCommunicationsPageLoader,
    StartAlertLoader,
    StartAlertsPageLoader,
    StopAlertCommunicationsPageLoader,
    StopAlertLoader,
    StopAlertsPageLoader,
    UpdateAlert,
    UpdateAlertCommunicationsPageSearchParams,
    UpdateAlertsPageSearchParams,
    UpdateAlertStatus,
} from './alert.action'
import { GenericProjectElementFacade } from '../../../../../shared/util-tool/facade/generic-project-element.facade'
import { ofActionSuccessful } from '@ngxs/store'
import { AlertDto } from '../dto/alert.dto'
import { AlertModel } from '../../../../../shared/util-model/model/alert.model'
import { AlertStatusEnum } from '../../../../../shared/util-model/enumeration/alert-status.enum'
import { CommunicationModel } from '../../../communication/data/model/communication.model'


@Injectable()
export class AlertFacade extends GenericProjectElementFacade {
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

    public get alert (): Signal<AlertModel | undefined> {
        return this.ngStore.selectSignal( AlertState.alert )
    }

    public get alert$ (): Observable<AlertModel | undefined> {
        return this.ngStore.select( AlertState.alert )
    }

    public get alertLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( AlertState.alertLoading )
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

    public startAlertLoader (): void {
        this.ngStore.dispatch( StartAlertLoader )
    }

    public stopAlertLoader (): void {
        this.ngStore.dispatch( StopAlertLoader )
    }

    public fetchAlert (id: string): void {
        this.ngStore.dispatch( new FetchAlert( this.selectedProjectId(), id ) )
    }

    public resetAlert (): void {
        this.ngStore.dispatch( ResetAlert )
    }

    public handleAlertFirstPageReload (): Observable<CreateAlert | DeleteAlert> {
        return this.actions$.pipe(
            ofActionSuccessful( CreateAlert, DeleteAlert ),
        )
    }

    public handleAlertCurrentPageReload (): Observable<UpdateAlert | DisableAlert | EnableAlert> {
        return this.actions$.pipe(
            ofActionSuccessful( UpdateAlert, DisableAlert, EnableAlert ),
        )
    }

    public createAlert (alert: AlertDto): Observable<CreateAlert> {
        this.ngStore.dispatch( new CreateAlert( this.selectedProjectId(), alert ) )

        return this.actions$.pipe( ofActionSuccessful( CreateAlert ) )
    }

    public handleAlertCreation (): Observable<CreateAlert> {
        return this.actions$.pipe( ofActionSuccessful( CreateAlert ) )
    }

    public handleAlertChange (): Observable<CreateAlert | UpdateAlert | DisableAlert | EnableAlert | DeleteAlert> {
        return this.actions$.pipe( ofActionSuccessful(
            CreateAlert,
            UpdateAlert,
            UpdateAlertStatus,
            DisableAlert,
            EnableAlert,
            DeleteAlert,
        ) )
    }

    public updateAlert (
        id: string,
        alert: AlertDto,
    ): Observable<UpdateAlert> {
        this.ngStore.dispatch( new UpdateAlert( this.selectedProjectId(), id, alert ) )

        return this.actions$.pipe( ofActionSuccessful( UpdateAlert ) )
    }

    public updateAlertStatus (
        id: string,
        status: AlertStatusEnum,
    ): void {
        this.ngStore.dispatch( new UpdateAlertStatus( this.selectedProjectId(), id, status ) )
    }

    public disableAlert (id: string): void {
        this.ngStore.dispatch( new DisableAlert( this.selectedProjectId(), id ) )
    }

    public enableAlert (id: string): void {
        this.ngStore.dispatch( new EnableAlert( this.selectedProjectId(), id ) )
    }

    public deleteAlert (alert: AlertModel): void {
        this.ngStore.dispatch( new DeleteAlert( this.selectedProjectId(), alert ) )
    }
}

import { computed, Injectable, Signal, inject } from '@angular/core'
import { PageModel } from '@shared/models/model/page.model'
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/rx.helper'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { Observable, tap } from 'rxjs'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { AlertDto } from '@pages/projects/[projectId]/alerts/data/dto/alert.dto'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'
import { CommunicationModel } from '@shared/models/model/communication.model'


/**
 * Purpose: Public entry point of the alert domain for pages, components and guards.
 * Scope: Exposes the alert store as signals, forwards its queries and runs the alert commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class AlertFacade extends GenericProjectElementFacade {
    private readonly store: InstanceType<typeof AlertStore> = inject( AlertStore )

    private readonly api: AlertApi = inject( AlertApi )

    public readonly alertsPage: Signal<PageModel<AlertModel> | undefined> = this.store.alerts.element

    public readonly alertsPageLoading: Signal<boolean> = this.store.alerts.loading

    public readonly alertsPageSilentLoading: Signal<boolean> = this.store.alerts.silentLoading

    public readonly alertsPageError: Signal<NotificationModel | undefined> = this.store.alerts.error

    private readonly alertsPageResetSearch: Signal<boolean> = this.store.alerts.params.resetSearch

    public readonly alertsPageTextSearchedParam: Signal<string | undefined> = this.store.alerts.params.q

    public readonly alertsPageStatusSearchedParam: Signal<string | undefined> = this.store.alerts.params.status

    public readonly alertsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.alerts.params.isVisible

    public readonly alertsPageStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.alerts.params.from() ),
        )

    public readonly alertsPageEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.alerts.params.to() ),
        )

    public readonly alertCommunicationsPage: Signal<PageModel<CommunicationModel> | undefined> = this.store.communications.element

    public readonly alertCommunicationsPageLoading: Signal<boolean> = this.store.communications.loading

    public readonly alertCommunicationsPageSilentLoading: Signal<boolean> = this.store.communications.silentLoading

    public readonly alertCommunicationsPageError: Signal<NotificationModel | undefined> = this.store.communications.error

    private readonly alertCommunicationsPageResetSearch: Signal<boolean> = this.store.communications.params.resetSearch

    public readonly alertCommunicationsPageTextSearchedParam: Signal<string | undefined> = this.store.communications.params.q

    public readonly alertCommunicationsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.communications.params.isVisible

    public readonly alertCommunicationsPageStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.communications.params.from() ),
        )

    public readonly alertCommunicationsPageEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.communications.params.to() ),
        )

    public readonly visibilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed( () =>
            this.store.metadata.visibilities().map( (status: SelectOptionModel<boolean | undefined>) => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }) ),
        )

    public readonly alertStatusMetadata: Signal<SelectOptionModel<AlertStatusEnum | undefined>[]> = this.store.metadata.status

    public fetchAlertsPage (
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.alertsPageResetSearch() ? 0 : page
        this.store.fetchAlertsPage( { projectId: this.selectedProjectId(), page: index, size: size } )
    }

    public inputPageSearchParameters (
        q: string | undefined,
        status: string | undefined,
        isVisible: boolean | undefined,
        from: Date | undefined,
        to: Date | undefined,
    ): void {
        const resetSearch: boolean = this.alertsPageTextSearchedParam() != q
                                     || this.alertsPageStatusSearchedParam() != status
                                     || this.alertsPageVisibilitySearchedParam() != isVisible
                                     || this.alertsPageStartDateTimeSearchedParam() != from?.toISOString()
                                     || this.alertsPageEndDateTimeSearchedParam() != to?.toISOString()

        if (resetSearch) {
            this.store.updateAlertsPageSearchParams( {
                resetSearch: resetSearch,
                q: q,
                status: status,
                isVisible: isVisible,
                from: from?.toISOString(),
                to: to?.toISOString(),
            } )
        }
    }

    public fetchAlertCommunicationsPage (
        id: string,
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.alertCommunicationsPageResetSearch() ? 0 : page
        this.store.fetchAlertCommunicationsPage( { projectId: this.selectedProjectId(), id: id, page: index, size: size } )
    }

    public inputCommunicationsPageSearchParameters (
        q: string | undefined,
        isVisible: boolean | undefined,
        from: Date | undefined,
        to: Date | undefined,
    ): void {
        const resetSearch: boolean = this.alertCommunicationsPageTextSearchedParam() != q
                                     || this.alertCommunicationsPageVisibilitySearchedParam() != isVisible
                                     || this.alertCommunicationsPageStartDateTimeSearchedParam() != from?.toISOString()
                                     || this.alertCommunicationsPageEndDateTimeSearchedParam() != to?.toISOString()

        if (resetSearch) {
            this.store.updateAlertCommunicationsPageSearchParams( {
                resetSearch: resetSearch,
                q: q,
                isVisible: isVisible,
                from: from?.toISOString(),
                to: to?.toISOString(),
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
            notifyOnError( this.uiFacade ),
        )
    }

    public createAlert (alert: AlertDto): Observable<AlertModel> {
        return this.api.createAlert( this.selectedProjectId(), alert ).pipe(
            notifyUnavailableOnly( this.uiFacade ),
            tap( (created: AlertModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateAlert (id: string, alert: AlertDto): Observable<AlertModel> {
        return this.api.updateAlertById( this.selectedProjectId(), id, alert ).pipe(
            notifyUnavailableOnly( this.uiFacade ),
            tap( (updated: AlertModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableAlert (id: string): Observable<AlertModel> {
        return this.api.disableAlertById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (disabled: AlertModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableAlert (id: string): Observable<AlertModel> {
        return this.api.enableAlertById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (enabled: AlertModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteAlert (alert: AlertModel): Observable<void> {
        return this.api.deleteAlertById( undefined, alert.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', alert ) ),
        )
    }

    public updateAlertStatus (id: string, status: AlertStatusEnum): Observable<AlertModel> {
        return this.api.updateAlertStatusById( this.selectedProjectId(), id, status ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (updated: AlertModel): void => this.onCommandSuccess( 'status', updated ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, alert: AlertModel): void {
        this.onCommandSucceeded( 'alert', command, 'alerts.notifications', 'pi pi-sort-alt', { title: alert?.title, status: alert?.status?.label } )

        this.reloadAlertsPage()
    }

    public reloadAlertsPage (): void {
        this.store.fetchAlertsPage( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.alertsPage() ) } )
    }
}

import { computed, Injectable, Signal, inject } from '@angular/core'
import { PageModel } from '@shared/models/model/page.model'
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { AlertApi } from '@pages/projects/[projectId]/alerts/data/state/alert.api'
import { notifyOnError } from '@shared/helpers/rx.helper'
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

    public readonly alertsPageQueryParam: Signal<string | undefined> = this.store.alerts.params.q

    public readonly alertsPageStatusParam: Signal<string | undefined> = this.store.alerts.params.status

    public readonly alertsPageIsVisibleParam: Signal<boolean | undefined> = this.store.alerts.params.isVisible

    public readonly alertsPageFromParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.alerts.params.from() ),
        )

    public readonly alertsPageToParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.alerts.params.to() ),
        )

    public readonly alertCommunicationsPage: Signal<PageModel<CommunicationModel> | undefined> = this.store.communications.element

    public readonly alertCommunicationsPageLoading: Signal<boolean> = this.store.communications.loading

    public readonly alertCommunicationsPageSilentLoading: Signal<boolean> = this.store.communications.silentLoading

    private readonly alertCommunicationsPageResetSearch: Signal<boolean> = this.store.communications.params.resetSearch

    public readonly visibilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed( () =>
            this.store.metadata.visibilities().map( (status: SelectOptionModel<boolean | undefined>) => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }) ),
        )

    public readonly alertCriticalityRule: Signal<string | undefined> = computed( (): string | undefined => this.store.metadata.criticality()?.rule )

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
        const resetSearch: boolean = this.alertsPageQueryParam() != q
                                     || this.alertsPageStatusParam() != status
                                     || this.alertsPageIsVisibleParam() != isVisible
                                     || this.alertsPageFromParam()?.toISOString() != from?.toISOString()
                                     || this.alertsPageToParam()?.toISOString() != to?.toISOString()

        if (resetSearch) {
            this.store.updateAlertsPageSearchParams( {
                resetSearch: resetSearch,
                q: q,
                status: status,
                isVisible: isVisible,
                from: from?.toISOString(),
                to: to?.toISOString(),
                sort: undefined,
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

    public loadOlderAlertCommunications (id: string): void {
        const shown: PageModel<CommunicationModel> | undefined = this.alertCommunicationsPage()
        if (shown?.hasNext) {
            this.store.fetchAlertCommunicationsPage( { projectId: this.selectedProjectId(), id: id, page: shown.page + 1, size: shown.size } )
        }
    }

    public reloadAlertCommunications (id: string): void {
        this.store.fetchAlertCommunicationsPage( { projectId: this.selectedProjectId(), id: id, ...CumulativePageHelper.reloadRequest( this.alertCommunicationsPage() ) } )
    }

    public handleAlertCreation (): Observable<unknown> {
        return this.commandEvents.on( 'alert', 'create' )
    }

    public createAlert (alert: AlertDto): Observable<AlertModel> {
        return this.api.createAlert( this.selectedProjectId(), alert ).pipe(
            tap( (created: AlertModel): void => this.onCommandSuccess( 'create', created ) ),
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
        this.onCommandSucceeded( 'alert', command, 'alerts.notifications', { title: alert?.title, status: alert?.status?.label } )

        this.reloadAlertsPage()
    }

    public reloadAlertsPage (): void {
        this.store.fetchAlertsPage( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.alertsPage() ) } )
    }
}

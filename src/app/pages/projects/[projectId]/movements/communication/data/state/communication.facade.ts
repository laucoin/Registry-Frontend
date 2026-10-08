import { toObservable } from '@angular/core/rxjs-interop'
import { computed, Injectable, Signal, inject } from '@angular/core'
import { PageModel } from '@shared/models/model/page.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { CommunicationStore } from '@pages/projects/[projectId]/movements/communication/data/state/communication.store'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { DateHelper } from '@shared/helpers/date.helper'
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/rx.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { Observable, tap } from 'rxjs'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { CommunicationDto } from '@pages/projects/[projectId]/movements/communication/data/dto/communication.dto'
import { MovementModel } from '@shared/models/model/movement.model'
import { AlertModel } from '@shared/models/model/alert.model'


/**
 * Purpose: Public entry point of the communication domain for pages, components and guards.
 * Scope: Exposes the communication store as signals, forwards its queries and runs the communication commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class CommunicationFacade extends GenericProjectElementFacade {
    private readonly store: InstanceType<typeof CommunicationStore> = inject( CommunicationStore )

    private readonly api: CommunicationApi = inject( CommunicationApi )
    private readonly datePipe: DateFormatPipe = inject( DateFormatPipe )

    public readonly communicationsPage: Signal<PageModel<CommunicationModel> | undefined> = this.store.communications.element

    public readonly communicationsPageLoading: Signal<boolean> = this.store.communications.loading

    public readonly communicationsPageSilentLoading: Signal<boolean> = this.store.communications.silentLoading

    public readonly communicationsPageError: Signal<ToastMessageOptions | undefined> = this.store.communications.error

    private readonly communicationsPageResetSearch: Signal<boolean> = this.store.communications.params.resetSearch

    public readonly communicationsPageTextSearchedParam: Signal<string | undefined> = this.store.communications.params.textSearched

    public readonly communicationsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.communications.params.visibilitySearched

    public readonly communicationsPageStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.communications.params.startDateTimeSearched() ),
        )

    public readonly communicationsPageEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.communications.params.endDateTimeSearched() ),
        )

    public readonly communication: Signal<CommunicationModel | undefined> = this.store.communication.element

    public readonly communication$: Observable<CommunicationModel | undefined> = toObservable( this.communication )

    public readonly communicationLoading: Signal<boolean> = this.store.communication.loading

    public readonly visibilitiesMetadata: Signal<SelectItem<boolean | undefined>[]> = computed( () =>
            this.store.metadata.visibilities().map( (status: SelectItem<boolean | undefined>) => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }) ),
        )

    public readonly searchedMovementsMetadata: Signal<SelectItem<MovementModel>[]> = this.store.metadata.searchedMovements

    public readonly searchedAlertsMetadata: Signal<SelectItem<AlertModel>[]> = this.store.metadata.searchedAlerts

    public fetchCommunicationsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.communicationsPageResetSearch() ? 0 : pageNumber
        this.store.fetchCommunicationsPage( { projectId: this.selectedProjectId(), pageNumber: index, pageSize: pageSize } )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        visibilitySearched: boolean | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.communicationsPageTextSearchedParam() != textSearched
                                     || this.communicationsPageVisibilitySearchedParam() != visibilitySearched
                                     || this.communicationsPageStartDateTimeSearchedParam() != startDateTimeSearched?.toISOString()
                                     || this.communicationsPageEndDateTimeSearchedParam() != endDateTimeSearched?.toISOString()

        if (resetSearch) {
            this.store.updateCommunicationsPageSearchParams( {
                resetSearch: resetSearch,
                textSearched: textSearched,
                visibilitySearched: visibilitySearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } )
        }
    }

    public fetchCommunication (id: string): void {
        this.store.fetchCommunication( { projectId: this.selectedProjectId(), id: id } )
    }

    public searchMovements (
        textSearched: string | undefined = undefined,
    ): void {
        this.store.searchMovements( { projectId: this.selectedProjectId(), textSearched: textSearched } )
    }

    public searchAlerts (
        textSearched: string | undefined = undefined,
    ): void {
        this.store.searchAlerts( { projectId: this.selectedProjectId(), textSearched: textSearched } )
    }

    public resetCommunication (): void {
        this.store.resetCommunication()
    }

    public handleCommunicationFirstPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'communication', 'create', 'delete' )
    }

    public handleCommunicationCurrentPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'communication', 'update', 'disable', 'enable' )
    }

    public createCommunication (communication: CommunicationDto): Observable<CommunicationModel> {
        return this.api.createCommunication( this.selectedProjectId(), communication ).pipe(
            notifyUnavailableOnly( this.uiFacade ),
            tap( (created: CommunicationModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateCommunication (id: string, communication: CommunicationDto): Observable<CommunicationModel> {
        return this.api.updateCommunicationById( this.selectedProjectId(), id, communication ).pipe(
            notifyUnavailableOnly( this.uiFacade ),
            tap( (updated: CommunicationModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableCommunication (id: string): Observable<CommunicationModel> {
        return this.api.disableCommunicationById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (disabled: CommunicationModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableCommunication (id: string): Observable<CommunicationModel> {
        return this.api.enableCommunicationById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (enabled: CommunicationModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteCommunication (communication: CommunicationModel): Observable<void> {
        return this.api.deleteCommunicationById( undefined, communication.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', communication ) ),
        )
    }

    // Creating or editing a communication is silent (the form resets itself); the other commands notify.
    private onCommandSuccess (command: CommandEvent, communication: CommunicationModel): void {
        if (command !== 'create' && command !== 'update') {
            this.onCommandSucceeded(
                'communication',
                command,
                'communications.notifications',
                'pi pi-sort-alt',
                { datetime: this.datePipe.transform( communication?.dateTime, 'datetime' ) },
            )
        } else {
            this.commandEvents.emit( 'communication', command )
        }

        const page: PageModel<CommunicationModel> | undefined = this.communicationsPage()
        this.fetchCommunicationsPage( page?.pageNumber, page?.pageSize )
    }
}

import { computed, Injectable, Signal, inject } from '@angular/core'
import { PageModel } from '@shared/models/model/page.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { CommunicationState } from '@pages/projects/[projectId]/movements/communication/data/state/communication.state'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { DateUtil } from '@shared/helpers/util/date.util'
import { CommunicationService } from '@pages/projects/[projectId]/movements/communication/data/state/communication.service'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/util/rx.util'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { Observable, tap } from 'rxjs'
import {
    FetchCommunication,
    FetchCommunicationsPage,
    ResetCommunication,
    SearchAlerts,
    SearchMovements,
    StartCommunicationLoader,
    StartCommunicationsPageLoader,
    StopCommunicationLoader,
    StopCommunicationsPageLoader,
    UpdateCommunicationsPageSearchParams,
} from '@pages/projects/[projectId]/movements/communication/data/state/communication.action'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { CommunicationDto } from '@pages/projects/[projectId]/movements/communication/data/dto/communication.dto'
import { MovementModel } from '@shared/models/model/movement.model'
import { AlertModel } from '@shared/models/model/alert.model'


@Injectable()
export class CommunicationFacade extends GenericProjectElementFacade {
    private readonly service: CommunicationService = inject( CommunicationService )
    private readonly datePipe: DateFormatPipe = inject( DateFormatPipe )

    public get communicationsPage (): Signal<PageModel<CommunicationModel> | undefined> {
        return this.ngStore.selectSignal( CommunicationState.communicationsPage )
    }

    public get communicationsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( CommunicationState.communicationsPageLoading )
    }

    public get communicationsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( CommunicationState.communicationsPageSilentLoading )
    }

    public get communicationsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( CommunicationState.communicationsPageError )
    }

    private get communicationsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( CommunicationState.communicationsPageResetSearch )
    }

    public get communicationsPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( CommunicationState.communicationsPageTextSearchedParam )
    }

    public get communicationsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( CommunicationState.communicationsPageVisibilitySearchedParam )
    }

    public get communicationsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( CommunicationState.communicationsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get communicationsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( CommunicationState.communicationsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get communication (): Signal<CommunicationModel | undefined> {
        return this.ngStore.selectSignal( CommunicationState.communication )
    }

    public get communication$ (): Observable<CommunicationModel | undefined> {
        return this.ngStore.select( CommunicationState.communication )
    }

    public get communicationLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( CommunicationState.communicationLoading )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( () =>
            this.ngStore.selectSignal( CommunicationState.visibilitiesMetadata )().map( (status: SelectItem<boolean | undefined>) => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )
    }

    public get searchedMovementsMetadata (): Signal<SelectItem<MovementModel>[]> {
        return this.ngStore.selectSignal( CommunicationState.searchedMovementsMetadata )
    }

    public get searchedAlertsMetadata (): Signal<SelectItem<AlertModel>[]> {
        return this.ngStore.selectSignal( CommunicationState.searchedAlertsMetadata )
    }

    public startCommunicationsPageLoader (): void {
        this.ngStore.dispatch( StartCommunicationsPageLoader )
    }

    public stopCommunicationsPageLoader (): void {
        this.ngStore.dispatch( StopCommunicationsPageLoader )
    }

    public fetchCommunicationsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.communicationsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchCommunicationsPage( this.selectedProjectId(), index, pageSize, force ) )
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
            this.ngStore.dispatch( new UpdateCommunicationsPageSearchParams( {
                resetSearch: resetSearch,
                textSearched: textSearched,
                visibilitySearched: visibilitySearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public startCommunicationLoader (): void {
        this.ngStore.dispatch( StartCommunicationLoader )
    }

    public stopCommunicationLoader (): void {
        this.ngStore.dispatch( StopCommunicationLoader )
    }

    public fetchCommunication (id: string): void {
        this.ngStore.dispatch( new FetchCommunication( this.selectedProjectId(), id ) )
    }

    public searchMovements (
        textSearched: string | undefined = undefined,
    ): void {
        this.ngStore.dispatch( new SearchMovements( this.selectedProjectId(), textSearched ) )
    }

    public searchAlerts (
        textSearched: string | undefined = undefined,
    ): void {
        this.ngStore.dispatch( new SearchAlerts( this.selectedProjectId(), textSearched ) )
    }

    public resetCommunication (): void {
        this.ngStore.dispatch( ResetCommunication )
    }

    public handleCommunicationFirstPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'communication', 'create', 'delete' )
    }

    public handleCommunicationCurrentPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'communication', 'update', 'disable', 'enable' )
    }

    public createCommunication (communication: CommunicationDto): Observable<CommunicationModel> {
        return this.service.createCommunication( this.selectedProjectId(), communication ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (created: CommunicationModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateCommunication (id: string, communication: CommunicationDto): Observable<CommunicationModel> {
        return this.service.updateCommunicationById( this.selectedProjectId(), id, communication ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: CommunicationModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableCommunication (id: string): Observable<CommunicationModel> {
        return this.service.disableCommunicationById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (disabled: CommunicationModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableCommunication (id: string): Observable<CommunicationModel> {
        return this.service.enableCommunicationById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (enabled: CommunicationModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteCommunication (communication: CommunicationModel): Observable<void> {
        return this.service.deleteCommunicationById( undefined, communication.id ).pipe(
            notifyOnError( this.registryFacade ),
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
        this.fetchCommunicationsPage( page?.pageNumber, page?.pageSize, true )
    }
}

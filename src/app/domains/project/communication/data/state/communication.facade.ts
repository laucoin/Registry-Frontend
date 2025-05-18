import { computed, Injectable, Signal } from '@angular/core'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { CommunicationModel } from '../model/communication.model'
import { CommunicationState } from './communication.state'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { DateUtil } from '../../../../../shared/util-tool/util/date.util'
import { Observable } from 'rxjs'
import {
    CreateCommunication,
    DeleteCommunication,
    DisableCommunication,
    EnableCommunication,
    FetchCommunication,
    FetchCommunicationsPage,
    ResetCommunication,
    SearchMovements,
    StartCommunicationLoader,
    StartCommunicationsPageLoader,
    StopCommunicationLoader,
    StopCommunicationsPageLoader,
    UpdateCommunication,
    UpdateCommunicationsPageSearchParams,
} from './communication.action'
import { GenericProjectElementFacade } from '../../../../../shared/util-tool/facade/generic-project-element.facade'
import { ofActionSuccessful } from '@ngxs/store'
import { CommunicationDto } from '../dto/communication.dto'
import { MovementModel } from '../../../../../shared/util-model/model/movement.model'


@Injectable()
export class CommunicationFacade extends GenericProjectElementFacade {
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

    public resetCommunication (): void {
        this.ngStore.dispatch( ResetCommunication )
    }

    public handleCommunicationFirstPageReload (): Observable<CreateCommunication | DeleteCommunication> {
        return this.actions$.pipe(
            ofActionSuccessful( CreateCommunication, DeleteCommunication ),
        )
    }

    public handleCommunicationCurrentPageReload (): Observable<UpdateCommunication | DisableCommunication | EnableCommunication> {
        return this.actions$.pipe(
            ofActionSuccessful( UpdateCommunication, DisableCommunication, EnableCommunication ),
        )
    }

    public createCommunication (communication: CommunicationDto): Observable<CreateCommunication> {
        this.ngStore.dispatch( new CreateCommunication( this.selectedProjectId(), communication ) )

        return this.actions$.pipe( ofActionSuccessful( CreateCommunication ) )
    }

    public handleCommunicationChange (): Observable<CreateCommunication | UpdateCommunication | DisableCommunication | EnableCommunication | DeleteCommunication> {
        return this.actions$.pipe( ofActionSuccessful(
            CreateCommunication,
            UpdateCommunication,
            DisableCommunication,
            EnableCommunication,
            DeleteCommunication,
        ) )
    }

    public updateCommunication (
        id: string,
        communication: CommunicationDto,
    ): Observable<UpdateCommunication> {
        this.ngStore.dispatch( new UpdateCommunication( this.selectedProjectId(), id, communication ) )

        return this.actions$.pipe( ofActionSuccessful( UpdateCommunication ) )
    }

    public disableCommunication (id: string): void {
        this.ngStore.dispatch( new DisableCommunication( this.selectedProjectId(), id ) )
    }

    public enableCommunication (id: string): void {
        this.ngStore.dispatch( new EnableCommunication( this.selectedProjectId(), id ) )
    }

    public deleteCommunication (communication: CommunicationModel): void {
        this.ngStore.dispatch( new DeleteCommunication( this.selectedProjectId(), communication ) )
    }
}

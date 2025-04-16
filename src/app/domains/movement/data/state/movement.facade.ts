import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { SelectItem, SelectItemGroup, ToastMessageOptions } from 'primeng/api'
import { ActionCompletion, ofActionCompleted, ofActionSuccessful } from '@ngxs/store'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { MovementState } from './movement.state'
import {
    CreateMovement,
    DeleteMovement,
    DisableMovement,
    EnableMovement,
    FetchMovement,
    FetchMovementsContent,
    FetchMovementsPage,
    FetchMovementTypes,
    ResetMovement,
    SearchParticipantsAndGroups,
    SearchReasonsAndActivities,
    SearchVehicles,
    StartMovementLoader,
    StartMovementsPageLoader,
    StopMovementLoader,
    StopMovementsPageLoader,
    UpdateMovement,
    UpdateMovementsPageSearchParams,
} from './movement.action'
import { MovementDto } from '../dto/movement.dto'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'
import { MovementReasonModel } from '../model/movement-reason.model'

@Injectable()
export class MovementFacade extends GenericEventElementFacade {
    public get movementsPage (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( MovementState.movementsPage )
    }

    public get movementsPageLoading (): Signal<boolean> {
        return computed( (): boolean => this.ngStore.selectSignal( MovementState.movementsPageLoading )() || this.registryFacade.contextEventLoading() )
    }

    public get movementsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( MovementState.movementsPageSilentLoading )
    }

    public get movementsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( MovementState.movementsPageError )
    }

    private get movementsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( MovementState.movementsPageResetSearch )
    }

    public get movementsPageTypeSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( MovementState.movementsPageTypeSearchedParam )
    }

    public get movementsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( MovementState.movementsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get movementsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( MovementState.movementsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get movementsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( MovementState.movementsPageVisibilitySearchedParam )
    }

    public get movement (): Signal<MovementModel | undefined> {
        return this.ngStore.selectSignal( MovementState.movement )
    }

    public get movement$ (): Observable<MovementModel | undefined> {
        return this.ngStore.select( MovementState.movement )
    }

    public get movementLoading (): Signal<boolean> {
        return computed( () =>
            this.ngStore.selectSignal( MovementState.movementLoading )() || this.registryFacade.contextEventLoading(),
        )
    }

    public get searchedReasonAndActivityMetadata (): Signal<MovementReasonModel[]> {
        return this.ngStore.selectSignal( MovementState.searchedReasonAndActivityMetadata )
    }

    public get searchedParticipantAndGroupMetadata (): Signal<SelectItemGroup<ParticipantModel | GroupModel>[]> {
        return this.ngStore.selectSignal( MovementState.searchedParticipantAndGroupMetadata )
    }

    public get searchedVehicleMetadata (): Signal<SelectItem<VehicleModel>[]> {
        return this.ngStore.selectSignal( MovementState.searchedVehicleMetadata )
    }

    public get movementTypesMetadata (): Signal<SelectItem<string | undefined>[]> {
        return this.ngStore.selectSignal( MovementState.movementTypesMetadata )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( () =>
            this.ngStore.selectSignal( MovementState.visibilitiesMetadata )().map( (status: SelectItem<boolean | undefined>) => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )
    }

    public startMovementsPageLoader (): void {
        this.ngStore.dispatch( StartMovementsPageLoader )
    }

    public stopMovementsPageLoader (): void {
        this.ngStore.dispatch( StopMovementsPageLoader )
    }

    public fetchMovementsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        const index: number | undefined = this.movementsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchMovementsPage( eventId, index, pageSize, force ) )
    }

    public fetchMovementsContents (
        movementIds: string[],
        eventId: string | undefined,
    ): void {
        this.ngStore.dispatch( new FetchMovementsContent( eventId, movementIds ) )
    }

    public inputPageSearchParameters (
        typeSearched: string | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.movementsPageTypeSearchedParam() != typeSearched
                                     || this.movementsPageStartDateTimeSearchedParam() != startDateTimeSearched?.toISOString()
                                     || this.movementsPageEndDateTimeSearchedParam() != endDateTimeSearched?.toISOString()
                                     || this.movementsPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateMovementsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                typeSearched: typeSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public startMovementLoader (): void {
        this.ngStore.dispatch( StartMovementLoader )
    }

    public stopMovementLoader (): void {
        this.ngStore.dispatch( StopMovementLoader )
    }

    public fetchMovement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchMovement( eventId, id ) )
    }

    public searchReasonsAndActivities (
        textSearched: string | undefined = undefined,
        typeSearched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchReasonsAndActivities( eventId, textSearched, typeSearched ) )
    }

    public searchParticipantsAndGroups (
        textSearched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchParticipantsAndGroups( eventId, textSearched ) )
    }

    public searchVehicles (
        textSearched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchVehicles( eventId, textSearched ) )
    }

    public resetMovement (): void {
        this.ngStore.dispatch( ResetMovement )
    }

    public handleMovementFirstPageReload (): Observable<CreateMovement | DeleteMovement> {
        return this.actions$.pipe(
            ofActionSuccessful( CreateMovement, DeleteMovement ),
        )
    }

    public handleMovementCurrentPageReload (): Observable<UpdateMovement | DisableMovement | EnableMovement> {
        return this.actions$.pipe(
            ofActionSuccessful( UpdateMovement, DisableMovement, EnableMovement ),
        )
    }

    public createMovement (
        movement: MovementDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateMovement> {
        this.ngStore.dispatch( new CreateMovement( eventId, movement ) )
        return this.actions$.pipe( ofActionSuccessful( CreateMovement ) )
    }

    public updateMovement (
        id: string,
        movement: MovementDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateMovement> {
        this.ngStore.dispatch( new UpdateMovement( eventId, id, movement ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateMovement ) )
    }

    public disableMovement (
        id: string,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<ActionCompletion<DisableMovement>> {
        this.ngStore.dispatch( new DisableMovement( eventId, id ) )

        return this.actions$.pipe( ofActionCompleted( DisableMovement ) )
    }

    public enableMovement (
        id: string,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<ActionCompletion<EnableMovement>> {
        this.ngStore.dispatch( new EnableMovement( eventId, id ) )

        return this.actions$.pipe( ofActionCompleted( EnableMovement ) )
    }

    public deleteMovement (
        movement: MovementModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<ActionCompletion<DeleteMovement>> {
        this.ngStore.dispatch( new DeleteMovement( eventId, movement ) )

        return this.actions$.pipe( ofActionCompleted( DeleteMovement ) )
    }

    public fetchMovementTypes (): void {
        if (this.movementTypesMetadata().length === 0) {
            this.ngStore.dispatch( FetchMovementTypes )
        }
    }
}

import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { SelectItem, SelectItemGroup, ToastMessageOptions } from 'primeng/api'
import { ofActionSuccessful } from '@ngxs/store'
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
    InputMovementsPageEndDateTimeSearched,
    InputMovementsPageStartDateTimeSearched,
    ResetMovement,
    SearchParticipantsAndGroups,
    SearchVehicles,
    SelectMovementsPageTypeSearched,
    SelectMovementsPageVisibilitySearched,
    StartMovementLoader,
    StartMovementsPageLoader,
    StopMovementLoader,
    StopMovementsPageLoader,
    UpdateMovement,
} from './movement.action'
import { MovementDto } from '../dto/movement.dto'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'

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

    public get movementsPageMovementTypeSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( MovementState.movementsPageMovementTypeSearchedParam )
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
        this.ngStore.dispatch( new FetchMovementsPage( eventId, pageNumber, pageSize, force ) )
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
        if (typeSearched !== this.movementsPageMovementTypeSearchedParam()) {
            this.ngStore.dispatch( new SelectMovementsPageTypeSearched( typeSearched ) )
        }

        if (startDateTimeSearched !== this.movementsPageStartDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputMovementsPageStartDateTimeSearched( startDateTimeSearched ) )
        }

        if (endDateTimeSearched !== this.movementsPageEndDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputMovementsPageEndDateTimeSearched( endDateTimeSearched ) )
        }

        if (visibilitySearched !== this.movementsPageVisibilitySearchedParam()) {
            this.ngStore.dispatch( new SelectMovementsPageVisibilitySearched( visibilitySearched ) )
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

    public searchParticipantsAndGroups (
        searched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchParticipantsAndGroups( eventId, searched ) )
    }

    public searchVehicles (
        searched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchVehicles( eventId, searched ) )
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

    public disableMovement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DisableMovement( eventId, id ) )
    }

    public enableMovement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new EnableMovement( eventId, id ) )
    }

    public deleteMovement (
        movement: MovementModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new DeleteMovement( eventId, movement ) )
    }

    public fetchMovementTypes (): void {
        if (this.movementTypesMetadata().length === 0) {
            this.ngStore.dispatch( FetchMovementTypes )
        }
    }
}

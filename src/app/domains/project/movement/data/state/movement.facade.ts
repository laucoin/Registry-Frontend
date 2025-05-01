import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { SelectItem, SelectItemGroup, ToastMessageOptions } from 'primeng/api'
import { ofActionSuccessful } from '@ngxs/store'
import { GroupModel } from '../../../../../shared/util-model/model/group.model'
import { MovementState } from './movement.state'
import {
    CreateGuestsMovement,
    CreateMovement,
    DeleteMovement,
    DisableMovement,
    EnableMovement,
    FetchMovement,
    FetchMovementsContent,
    FetchMovementsPage,
    FetchMovementTypes,
    FetchParticipantTypes,
    ResetMovement,
    SearchParticipantsAndGroups,
    SearchReasonsAndActivities,
    SearchVehicles,
    StartMovementLoader,
    StartMovementsPageLoader,
    StopMovementLoader,
    StopMovementsPageLoader,
    UpdateGuestsMovement,
    UpdateMovement,
    UpdateMovementsPageSearchParams,
} from './movement.action'
import { MovementDto } from '../dto/movement.dto'
import { MovementModel } from '../../../../../shared/util-model/model/movement.model'
import { ParticipantModel } from '../../../../../shared/util-model/model/participant.model'
import { GenericProjectElementFacade } from '../../../../../shared/util-tool/facade/generic-project-element.facade'
import { VehicleModel } from '../../../../../shared/util-model/model/vehicle.model'
import { DateUtil } from '../../../../../shared/util-tool/util/date.util'
import { MovementReasonModel } from '../model/movement-reason.model'
import { ParticipantTypeEnum } from '../../../../../shared/util-model/enumeration/participant-type.enum'
import { MovementTypeEnum } from '../../../../../shared/util-model/enumeration/movement-type.enum'

@Injectable()
export class MovementFacade extends GenericProjectElementFacade {
    public get movementsPage (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( MovementState.movementsPage )
    }

    public get movementsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( MovementState.movementsPageLoading )
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
        return this.ngStore.selectSignal( MovementState.movementLoading )
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

    public get movementTypesMetadata (): Signal<SelectItem<MovementTypeEnum | undefined>[]> {
        return this.ngStore.selectSignal( MovementState.movementTypesMetadata )
    }

    public get participantTypesMetadata (): Signal<SelectItem<ParticipantTypeEnum>[]> {
        return this.ngStore.selectSignal( MovementState.participantTypesMetadata )
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
    ): void {
        const index: number | undefined = this.movementsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchMovementsPage( this.selectedProjectId(), index, pageSize, force ) )
    }

    public fetchMovementsContents (movementIds: string[]): void {
        this.ngStore.dispatch( new FetchMovementsContent( this.selectedProjectId(), movementIds ) )
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

    public fetchMovement (id: string): void {
        this.ngStore.dispatch( new FetchMovement( this.selectedProjectId(), id ) )
    }

    public searchReasonsAndActivities (
        textSearched: string | undefined = undefined,
        typeSearched: string,
        contentTypeSearched: ParticipantTypeEnum,
    ): void {
        this.ngStore.dispatch( new SearchReasonsAndActivities(
            this.selectedProjectId(),
            textSearched,
            typeSearched,
            contentTypeSearched,
        ) )
    }

    public searchParticipantsAndGroups (
        contentTypeSearched: ParticipantTypeEnum,
        textSearched: string | undefined = undefined,
    ): void {
        this.ngStore.dispatch( new SearchParticipantsAndGroups(
            this.selectedProjectId(),
            contentTypeSearched,
            textSearched,
        ) )
    }

    public searchVehicles (textSearched: string | undefined = undefined): void {
        this.ngStore.dispatch( new SearchVehicles( this.selectedProjectId(), textSearched ) )
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

    public createMovement (movement: MovementDto): Observable<CreateMovement | CreateGuestsMovement> {
        if (movement.contentType === ParticipantTypeEnum.REGISTERED) {
            this.ngStore.dispatch( new CreateMovement( this.selectedProjectId(), movement ) )
        } else {
            this.ngStore.dispatch( new CreateGuestsMovement( this.selectedProjectId(), movement ) )
        }
        return this.actions$.pipe( ofActionSuccessful( CreateMovement, CreateGuestsMovement ) )
    }

    public updateMovement (
        id: string,
        movement: MovementDto,
    ): Observable<UpdateMovement | UpdateGuestsMovement> {
        if (movement.contentType === ParticipantTypeEnum.REGISTERED) {
            this.ngStore.dispatch( new UpdateMovement( this.selectedProjectId(), id, movement ) )
        } else {
            this.ngStore.dispatch( new UpdateGuestsMovement( this.selectedProjectId(), id, movement ) )
        }
        return this.actions$.pipe( ofActionSuccessful( UpdateMovement, UpdateGuestsMovement ) )
    }

    public disableMovement (id: string): void {
        this.ngStore.dispatch( new DisableMovement( this.selectedProjectId(), id ) )
    }

    public enableMovement (id: string): void {
        this.ngStore.dispatch( new EnableMovement( this.selectedProjectId(), id ) )
    }

    public deleteMovement (movement: MovementModel): void {
        this.ngStore.dispatch( new DeleteMovement( this.selectedProjectId(), movement ) )
    }

    public fetchMovementTypes (): void {
        if (this.movementTypesMetadata().length === 0) {
            this.ngStore.dispatch( FetchMovementTypes )
        }
    }

    public fetchParticipantTypes (): void {
        if (this.participantTypesMetadata().length === 0) {
            this.ngStore.dispatch( FetchParticipantTypes )
        }
    }
}

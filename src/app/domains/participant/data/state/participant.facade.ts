import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { ParticipantDto } from '../dto/participant.dto'
import {
    CreateParticipant,
    DeleteParticipant,
    DisableParticipant,
    EnableParticipant,
    FetchParticipant,
    FetchParticipantMovementsPage,
    FetchParticipantMovementTypes,
    FetchParticipantsPage,
    InputParticipantMovementsPageDateRange,
    InputParticipantMovementsPageSearch,
    InputParticipantsPageDateRange,
    InputParticipantsPageSearch,
    ResetParticipant,
    SearchGroups,
    SearchUsers,
    SelectParticipantMovementsPageOrder,
    SelectParticipantMovementsPageType,
    SelectParticipantMovementsPageVisibility,
    SelectParticipantsPageOrder,
    SelectParticipantsPageVisibility,
    StartParticipantLoader,
    StartParticipantMovementsPageLoader,
    StartParticipantsPageLoader,
    StopParticipantLoader,
    StopParticipantMovementsPageLoader,
    StopParticipantsPageLoader,
    UpdateParticipant,
} from './participant.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { ofActionSuccessful } from '@ngxs/store'
import { UserDto } from '../../../../shared/util-model/dto/user.dto'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { ParticipantState } from './participant.state'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { MovementModel } from '../../../../shared/util-model/movement.model'

@Injectable()
export class ParticipantFacade extends GenericEventElementFacade {
    public get participantsPage (): Observable<PageModel<ParticipantModel> | undefined> {
        return this.ngStore.select( ParticipantState.participantsPage )
    }

    public get participantsPageLoading (): Observable<boolean> {
        return this.ngStore.select( ParticipantState.participantsPageLoading )
    }

    public get participantsPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( ParticipantState.participantsPageSilentLoading )
    }

    public get participantsPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( ParticipantState.participantsPageError )
    }

    public get actualParticipantsPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( ParticipantState.participantsPageSearchParam )
    }

    public get actualParticipantsPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( ParticipantState.participantsPageStartDateParam ),
            this.ngStore.selectSnapshot( ParticipantState.participantsPageEndDateParam ),
        )
    }

    public get actualParticipantsPageOnlyVisibleParam (): boolean {
        return this.ngStore.selectSnapshot( ParticipantState.participantsPageOnlyVisibleParam )
    }

    public get actualParticipantsPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( ParticipantState.participantsPageOrderParam )
    }

    public get participantMovementsPage (): Observable<PageModel<MovementModel> | undefined> {
        return this.ngStore.select( ParticipantState.participantMovementsPage )
    }

    public get participantMovementsPageLoading (): Observable<boolean> {
        return this.ngStore.select( ParticipantState.participantMovementsPageLoading )
    }

    public get participantMovementsPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( ParticipantState.participantMovementsPageSilentLoading )
    }

    public get participantMovementsPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( ParticipantState.participantMovementsPageError )
    }

    public get actualParticipantMovementsPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( ParticipantState.participantMovementsPageSearchParam )
    }

    public get actualParticipantMovementsPageMovementTypeParam (): string | undefined {
        return this.ngStore.selectSnapshot( ParticipantState.participantMovementsPageMovementTypeParam )
    }

    public get actualParticipantMovementsPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( ParticipantState.participantMovementsPageStartDateParam ),
            this.ngStore.selectSnapshot( ParticipantState.participantMovementsPageEndDateParam ),
        )
    }

    public get actualParticipantMovementsPageOnlyVisibleParam (): boolean {
        return this.ngStore.selectSnapshot( ParticipantState.participantMovementsPageOnlyVisibleParam )
    }

    public get actualParticipantMovementsPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( ParticipantState.participantMovementsPageOrderParam )
    }

    public get participant (): Observable<ParticipantModel | undefined> {
        return this.ngStore.select( ParticipantState.participant )
    }

    public get participantLoading (): Observable<boolean> {
        return this.ngStore.select( ParticipantState.participantLoading )
    }

    public get searchedUsersMetadata (): Observable<SelectItem<UserDto>[]> {
        return this.ngStore.select( ParticipantState.searchedUsersMetadata )
    }

    public get searchedGroupsMetadata (): Observable<SelectItem<GroupModel>[]> {
        return this.ngStore.select( ParticipantState.searchedGroupsMetadata )
    }

    public get movementTypesMetadata (): Observable<SelectItem<string>[]> {
        return this.ngStore.select( ParticipantState.movementTypesMetadata )
    }

    public startParticipantsPageLoader (): void {
        this.ngStore.dispatch( StartParticipantsPageLoader )
    }

    public stopParticipantsPageLoader (): void {
        this.ngStore.dispatch( StopParticipantsPageLoader )
    }

    public fetchParticipantsPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchParticipantsPage( eventId, offset, limit, force ) )
    }

    public inputParticipantsPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputParticipantsPageSearch( searched ) )
    }

    public inputParticipantsPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputParticipantsPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectParticipantsPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectParticipantsPageVisibility( onlyVisible ) )
    }

    public selectParticipantsPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectParticipantsPageOrder( order ) )
    }

    public startParticipantMovementsPageLoader (): void {
        this.ngStore.dispatch( StartParticipantMovementsPageLoader )
    }

    public stopParticipantMovementsPageLoader (): void {
        this.ngStore.dispatch( StopParticipantMovementsPageLoader )
    }

    public fetchParticipantMovementTypes (eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchParticipantMovementTypes( eventId ) )
    }

    public fetchParticipantMovementsPage (
        id: string,
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchParticipantMovementsPage( eventId, id, offset, limit, force ) )
    }

    public inputParticipantMovementsPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputParticipantMovementsPageSearch( searched ) )
    }

    public selectParticipantMovementsPageType (type: string | undefined): void {
        this.ngStore.dispatch( new SelectParticipantMovementsPageType( type ) )
    }

    public inputParticipantMovementsPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputParticipantMovementsPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectParticipantMovementsPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectParticipantMovementsPageVisibility( onlyVisible ) )
    }

    public selectParticipantMovementsPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectParticipantMovementsPageOrder( order ) )
    }

    public startParticipantLoader (): void {
        this.ngStore.dispatch( StartParticipantLoader )
    }

    public stopParticipantLoader (): void {
        this.ngStore.dispatch( StopParticipantLoader )
    }

    public fetchParticipant (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchParticipant( eventId, id ) )
    }

    public searchUsers (
        searched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchUsers( eventId, searched ) )
    }

    public searchGroups (
        searched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchGroups( eventId, searched ) )
    }

    public resetParticipant (): void {
        this.ngStore.dispatch( ResetParticipant )
    }

    public createParticipant (
        participant: ParticipantDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateParticipant> {
        this.ngStore.dispatch( new CreateParticipant( eventId, participant ) )
        return this.actions$.pipe( ofActionSuccessful( CreateParticipant ) )
    }

    public handleParticipantCreation (): Observable<CreateParticipant> {
        return this.actions$.pipe( ofActionSuccessful( CreateParticipant ) )
    }

    public updateParticipant (
        id: string,
        participant: ParticipantDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateParticipant> {
        this.ngStore.dispatch( new UpdateParticipant( eventId, id, participant ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateParticipant ) )
    }

    public disableParticipant (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DisableParticipant( eventId, id ) )
    }

    public enableParticipant (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new EnableParticipant( eventId, id ) )
    }

    public deleteParticipant (
        participant: ParticipantModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new DeleteParticipant( eventId, participant ) )
    }
}

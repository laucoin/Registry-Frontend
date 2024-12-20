import { Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { StateModel } from '../../../../shared/util-model/model/state.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { ParticipantDto } from '../dto/participant.dto'
import {
    CreateParticipant,
    DeleteParticipant,
    DisableParticipant,
    EnableParticipant,
    FetchParticipant,
    FetchParticipantPage,
    InputParticipantPageDateRange,
    InputParticipantPageSearch,
    ResetParticipant,
    SearchParticipant,
    SelectParticipantPageOrder,
    SelectParticipantPageVisibility,
    StartParticipantLoader,
    StartParticipantsPageLoader,
    StopParticipantLoader,
    StopParticipantsPageLoader,
    UpdateParticipant,
} from './participant.action'
import { ToastMessageOptions } from 'primeng/api'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { ofActionSuccessful } from '@ngxs/store'
import { ItemModel } from '../../../../shared/util-model/model/item.model'

@Injectable()
export class ParticipantFacade extends GenericEventElementFacade<ParticipantModel> {
    public get page (): Observable<PageModel<ParticipantModel> | undefined> {
        return this.ngStore.select( (state: StateModel): PageModel<ParticipantModel> | undefined => state.participant.participants.element )
    }

    public get actualPageSearched (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.participant.participants.params.searched )
    }

    public get actualPageDateRange (): Date[] | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): Date[] | undefined => FormUtil.buildDateRange(
            state.participant.participants.params.startDate,
            state.participant.participants.params.endDate,
        ) )
    }

    public get actualPageOnlyVisible (): boolean {
        return this.ngStore.selectSnapshot( (state: StateModel): boolean => state.participant.participants.params.onlyVisible )
    }

    public get actualPageOrder (): OrderEnum {
        return this.ngStore.selectSnapshot( (state: StateModel): OrderEnum => state.participant.participants.params.order )
    }

    public get pageLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.participant.participants.loading )
    }

    public get pageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.participant.participants.silentLoading )
    }

    public get pageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.participant.participants.error )
    }

    public get searchedParticipants (): Observable<ItemModel[]> {
        return this.ngStore.select( (state: StateModel): ParticipantModel[] => state.participant.searched ).pipe(
            map( (participants: ParticipantModel[]): ItemModel[] => participants.map( (participant: ParticipantModel): ItemModel => ({
                label: `${participant.firstName} ${participant.lastName}`,
                value: participant.id,
            }) ) ),
        )
    }

    public get actualSearchedParticipants (): ParticipantModel[] {
        return this.ngStore.selectSnapshot( (state: StateModel): ParticipantModel[] => state.participant.searched )
    }

    public get element (): Observable<ParticipantModel | undefined> {
        return this.ngStore.select( (state: StateModel): ParticipantModel | undefined => state.participant.participant.element )
    }

    public get elementLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.participant.participant.loading )
    }

    public get elementError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.participant.participant.error )
    }

    public startPageLoader (): void {
        this.ngStore.dispatch( StartParticipantsPageLoader )
    }

    public stopPageLoader (): void {
        this.ngStore.dispatch( StopParticipantsPageLoader )
    }

    public fetchElementPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchParticipantPage( eventId, offset, limit, force ) )
    }

    public inputPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputParticipantPageSearch( searched ) )
    }

    public inputPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputParticipantPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectParticipantPageVisibility( onlyVisible ) )
    }

    public selectPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectParticipantPageOrder( order ) )
    }

    public startElementLoader (): void {
        this.ngStore.dispatch( StartParticipantLoader )
    }

    public stopElementLoader (): void {
        this.ngStore.dispatch( StopParticipantLoader )
    }

    public fetchElement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchParticipant( eventId, id ) )
    }

    public searchParticipant (
        onlyPresent: boolean,
        searched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchParticipant( eventId, onlyPresent, searched ) )
    }

    public resetElement (): void {
        this.ngStore.dispatch( ResetParticipant )
    }

    public createElement (
        participant: ParticipantDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateParticipant> {
        this.ngStore.dispatch( new CreateParticipant( eventId, participant ) )
        return this.actions$.pipe( ofActionSuccessful( CreateParticipant ) )
    }

    public updateElement (
        id: string,
        participant: ParticipantDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateParticipant> {
        this.ngStore.dispatch( new UpdateParticipant( eventId, id, participant ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateParticipant ) )
    }

    public disableElement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DisableParticipant( eventId, id ) )
    }

    public enableElement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new EnableParticipant( eventId, id ) )
    }

    public deleteElement (element: ParticipantModel, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DeleteParticipant( eventId, element ) )
    }
}

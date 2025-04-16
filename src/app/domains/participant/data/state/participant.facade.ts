import { computed, Injectable, Signal } from '@angular/core'
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
    FetchParticipantMovementsContents,
    FetchParticipantMovementsPage,
    FetchParticipantPresencesStatus,
    FetchParticipantsPage,
    ResetParticipant,
    SearchGroups,
    SearchUsers,
    StartParticipantLoader,
    StartParticipantMovementsPageLoader,
    StartParticipantsPageLoader,
    StopParticipantLoader,
    StopParticipantMovementsPageLoader,
    StopParticipantsPageLoader,
    UpdateParticipant,
    UpdateParticipantMovementsPageSearchParams,
    UpdateParticipantsPageSearchParams,
} from './participant.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ActionCompletion, ofActionCompleted, ofActionSuccessful } from '@ngxs/store'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { ParticipantState } from './participant.state'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'
import { UserModel } from '../../../../shared/util-model/model/user.model'

@Injectable()
export class ParticipantFacade extends GenericEventElementFacade {
    public get participantsPage (): Signal<PageModel<ParticipantModel> | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participantsPage )
    }

    public get participantsPageLoading (): Signal<boolean> {
        return computed( (): boolean => this.ngStore.selectSignal( ParticipantState.participantsPageLoading )() || this.registryFacade.contextEventLoading() )
    }

    public get participantsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantState.participantsPageSilentLoading )
    }

    public get participantsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participantsPageError )
    }

    public get participantsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantState.participantsPageResetSearch )
    }

    public get participantsPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participantsPageTextSearchedParam )
    }

    public get participantsPageStatusSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participantsPageStatusSearchedParam )
    }

    public get participantsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participantsPageVisibilitySearchedParam )
    }

    public get participantMovementsPage (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participantMovementsPage )
    }

    public get participantMovementsPageLoading (): Signal<boolean> {
        return computed( (): boolean =>
            this.ngStore.selectSignal( ParticipantState.participantMovementsPageLoading )() || this.registryFacade.contextEventLoading(),
        )
    }

    public get participantMovementsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantState.participantMovementsPageSilentLoading )
    }

    public get participantMovementsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participantMovementsPageError )
    }

    public get participantMovementsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantState.participantMovementsPageResetSearch )
    }

    public get participantMovementsPageTypeSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participantMovementsPageTypeSearchedParam )
    }

    public get participantMovementsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( ParticipantState.participantMovementsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get participantMovementsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( ParticipantState.participantMovementsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get participantMovementsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participantMovementsPageVisibilitySearchedParam )
    }

    public get participant (): Signal<ParticipantModel | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participant )
    }

    public get participant$ (): Observable<ParticipantModel | undefined> {
        return this.ngStore.select( ParticipantState.participant )
    }

    public get participantLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantState.participantLoading )
    }

    public get searchedUsersMetadata (): Signal<SelectItem<UserModel>[]> {
        return this.ngStore.selectSignal( ParticipantState.searchedUsersMetadata )
    }

    public get searchedGroupsMetadata (): Signal<SelectItem<GroupModel>[]> {
        return this.ngStore.selectSignal( ParticipantState.searchedGroupsMetadata )
    }

    public get presencesStatusMetadata (): Signal<SelectItem<string | undefined>[]> {
        return this.ngStore.selectSignal( ParticipantState.presencesStatusMetadata )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( ParticipantState.visibilitiesMetadata )().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )
    }

    public startParticipantsPageLoader (): void {
        this.ngStore.dispatch( StartParticipantsPageLoader )
    }

    public stopParticipantsPageLoader (): void {
        this.ngStore.dispatch( StopParticipantsPageLoader )
    }

    public fetchParticipantsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        const index: number | undefined = this.participantsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchParticipantsPage( eventId, index, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        statusSearched: string | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.participantsPageTextSearchedParam() != textSearched
                                     || this.participantsPageStatusSearchedParam() != statusSearched
                                     || this.participantsPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateParticipantsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                statusSearched: statusSearched,
                textSearched: textSearched,
            } ) )
        }
    }

    public startParticipantMovementsPageLoader (): void {
        this.ngStore.dispatch( StartParticipantMovementsPageLoader )
    }

    public stopParticipantMovementsPageLoader (): void {
        this.ngStore.dispatch( StopParticipantMovementsPageLoader )
    }

    public fetchParticipantMovementsPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        const index: number | undefined = this.participantMovementsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchParticipantMovementsPage( eventId, id, index, pageSize, force ) )
    }

    public fetchParticipantMovementsContent (
        movementIds: string[],
        eventId: string | undefined,
    ): void {
        this.ngStore.dispatch( new FetchParticipantMovementsContents( eventId, movementIds ) )
    }

    public inputMovementsPageSearchParameters (
        typeSearched: string | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.participantMovementsPageTypeSearchedParam() != typeSearched
                                     || this.participantMovementsPageStartDateTimeSearchedParam() != startDateTimeSearched?.toISOString()
                                     || this.participantMovementsPageEndDateTimeSearchedParam() != endDateTimeSearched?.toISOString()
                                     || this.participantMovementsPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateParticipantMovementsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                typeSearched: typeSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
        }
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
        textSearched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchUsers( eventId, textSearched ) )
    }

    public searchGroups (
        textSearched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchGroups( eventId, textSearched ) )
    }

    public resetParticipant (): void {
        this.ngStore.dispatch( ResetParticipant )
    }

    public handleParticipantFirstPageReload (): Observable<CreateParticipant | DeleteParticipant> {
        return this.actions$.pipe(
            ofActionSuccessful( CreateParticipant, DeleteParticipant ),
        )
    }

    public handleParticipantCurrentPageReload (): Observable<UpdateParticipant | DisableParticipant | EnableParticipant> {
        return this.actions$.pipe(
            ofActionSuccessful( UpdateParticipant, DisableParticipant, EnableParticipant ),
        )
    }

    public createParticipant (
        participant: ParticipantDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateParticipant> {
        this.ngStore.dispatch( new CreateParticipant( eventId, participant ) )
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

    public disableParticipant (
        id: string,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<ActionCompletion<DisableParticipant>> {
        this.ngStore.dispatch( new DisableParticipant( eventId, id ) )

        return this.actions$.pipe( ofActionCompleted( DisableParticipant ) )
    }

    public enableParticipant (
        id: string,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<ActionCompletion<EnableParticipant>> {
        this.ngStore.dispatch( new EnableParticipant( eventId, id ) )

        return this.actions$.pipe( ofActionCompleted( EnableParticipant ) )
    }

    public deleteParticipant (
        participant: ParticipantModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<ActionCompletion<DeleteParticipant>> {
        this.ngStore.dispatch( new DeleteParticipant( eventId, participant ) )

        return this.actions$.pipe( ofActionCompleted( DeleteParticipant ) )
    }

    public fetchPresencesStatus (): void {
        if (this.presencesStatusMetadata().length === 0) {
            this.ngStore.dispatch( FetchParticipantPresencesStatus )
        }
    }
}

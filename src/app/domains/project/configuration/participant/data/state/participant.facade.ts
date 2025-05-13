import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../../../shared/util-model/model/page.model'
import { ParticipantModel } from '../../../../../../shared/util-model/model/participant.model'
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
import { ofActionSuccessful } from '@ngxs/store'
import { GroupModel } from '../../../../../../shared/util-model/model/group.model'
import { ParticipantState } from './participant.state'
import { GenericProjectElementFacade } from '../../../../../../shared/util-tool/facade/generic-project-element.facade'
import { MovementModel } from '../../../../../../shared/util-model/model/movement.model'
import { DateUtil } from '../../../../../../shared/util-tool/util/date.util'
import { UserModel } from '../../../../../../shared/util-model/model/user.model'
import { PresenceStatusEnum } from '../../../../../../shared/util-model/enumeration/presence-status.enum'

@Injectable()
export class ParticipantFacade extends GenericProjectElementFacade {
    public get participantsPage (): Signal<PageModel<ParticipantModel> | undefined> {
        return this.ngStore.selectSignal( ParticipantState.participantsPage )
    }

    public get participantsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantState.participantsPageLoading )
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
        return this.ngStore.selectSignal( ParticipantState.participantMovementsPageLoading )
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

    public get presencesStatusMetadata (): Signal<SelectItem<PresenceStatusEnum | undefined>[]> {
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
    ): void {
        const index: number | undefined = this.participantsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchParticipantsPage( this.selectedProjectId(), index, pageSize, force ) )
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
    ): void {
        const index: number | undefined = this.participantMovementsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchParticipantMovementsPage(
            this.selectedProjectId(),
            id,
            index,
            pageSize,
            force,
        ) )
    }

    public fetchParticipantMovementsContent (movementIds: string[]): void {
        this.ngStore.dispatch( new FetchParticipantMovementsContents( this.selectedProjectId(), movementIds ) )
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
                currentMovements: false,
                linkedToActivity: undefined,
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

    public fetchParticipant (id: string): void {
        this.ngStore.dispatch( new FetchParticipant( this.selectedProjectId(), id ) )
    }

    public searchUsers (
        textSearched: string | undefined = undefined,
    ): void {
        this.ngStore.dispatch( new SearchUsers( this.selectedProjectId(), textSearched ) )
    }

    public searchGroups (
        textSearched: string | undefined = undefined,
    ): void {
        this.ngStore.dispatch( new SearchGroups( this.selectedProjectId(), textSearched ) )
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
    ): Observable<CreateParticipant> {
        this.ngStore.dispatch( new CreateParticipant( this.selectedProjectId(), participant ) )
        return this.actions$.pipe( ofActionSuccessful( CreateParticipant ) )
    }

    public updateParticipant (
        id: string,
        participant: ParticipantDto,
    ): Observable<UpdateParticipant> {
        this.ngStore.dispatch( new UpdateParticipant( this.selectedProjectId(), id, participant ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateParticipant ) )
    }

    public disableParticipant (
        id: string,
    ): void {
        this.ngStore.dispatch( new DisableParticipant( this.selectedProjectId(), id ) )
    }

    public enableParticipant (
        id: string,
    ): void {
        this.ngStore.dispatch( new EnableParticipant( this.selectedProjectId(), id ) )
    }

    public deleteParticipant (
        participant: ParticipantModel,
    ): void {
        this.ngStore.dispatch( new DeleteParticipant( this.selectedProjectId(), participant ) )
    }

    public fetchPresencesStatus (): void {
        if (this.presencesStatusMetadata().length === 0) {
            this.ngStore.dispatch( FetchParticipantPresencesStatus )
        }
    }
}

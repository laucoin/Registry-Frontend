import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ParticipantDto } from '@pages/projects/[projectId]/configuration/participants/data/dto/participant.dto'
import {
    FetchParticipantMovementsContents,
    FetchParticipantMovementsPage,
    FetchParticipantPresencesStatus,
    FetchParticipantsPage,
    SearchGroups,
    SearchUsers,
    StartParticipantMovementsPageLoader,
    StartParticipantsPageLoader,
    StopParticipantMovementsPageLoader,
    StopParticipantsPageLoader,
    UpdateParticipantMovementsPageSearchParams,
    UpdateParticipantsPageSearchParams,
} from '@pages/projects/[projectId]/configuration/participants/data/state/participant.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GroupModel } from '@shared/models/model/group.model'
import { ParticipantStore } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.store'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { MovementModel } from '@shared/models/model/movement.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/rx.helper'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { UserModel } from '@shared/models/model/user.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

@Injectable()
export class ParticipantFacade extends GenericProjectElementFacade {
    private readonly api: ParticipantApi = inject( ParticipantApi )

    public get participantsPage (): Signal<PageModel<ParticipantModel> | undefined> {
        return this.ngStore.selectSignal( ParticipantStore.participantsPage )
    }

    public get participantsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantStore.participantsPageLoading )
    }

    public get participantsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantStore.participantsPageSilentLoading )
    }

    public get participantsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ParticipantStore.participantsPageError )
    }

    public get participantsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantStore.participantsPageResetSearch )
    }

    public get participantsPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ParticipantStore.participantsPageTextSearchedParam )
    }

    public get participantsPageStatusSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ParticipantStore.participantsPageStatusSearchedParam )
    }

    public get participantsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ParticipantStore.participantsPageVisibilitySearchedParam )
    }

    public get participantMovementsPage (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( ParticipantStore.participantMovementsPage )
    }

    public get participantMovementsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantStore.participantMovementsPageLoading )
    }

    public get participantMovementsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantStore.participantMovementsPageSilentLoading )
    }

    public get participantMovementsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( ParticipantStore.participantMovementsPageError )
    }

    public get participantMovementsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( ParticipantStore.participantMovementsPageResetSearch )
    }

    public get participantMovementsPageTypeSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( ParticipantStore.participantMovementsPageTypeSearchedParam )
    }

    public get participantMovementsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateHelper.buildDate( this.ngStore.selectSignal( ParticipantStore.participantMovementsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get participantMovementsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateHelper.buildDate( this.ngStore.selectSignal( ParticipantStore.participantMovementsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get participantMovementsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( ParticipantStore.participantMovementsPageVisibilitySearchedParam )
    }

    public get searchedUsersMetadata (): Signal<SelectItem<UserModel>[]> {
        return this.ngStore.selectSignal( ParticipantStore.searchedUsersMetadata )
    }

    public get searchedGroupsMetadata (): Signal<SelectItem<GroupModel>[]> {
        return this.ngStore.selectSignal( ParticipantStore.searchedGroupsMetadata )
    }

    public get presencesStatusMetadata (): Signal<SelectItem<PresenceStatusEnum | undefined>[]> {
        return this.ngStore.selectSignal( ParticipantStore.presencesStatusMetadata )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( ParticipantStore.visibilitiesMetadata )().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
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

    public fetchPresencesStatus (): void {
        this.ngStore.dispatch( FetchParticipantPresencesStatus )
    }

    public handleParticipantFirstPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'participant', 'create', 'delete' )
    }

    public handleParticipantCurrentPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'participant', 'update', 'disable', 'enable' )
    }

    public fetchParticipant (id: string): Observable<ParticipantModel> {
        return this.api.findParticipantById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
        )
    }

    public createParticipant (participant: ParticipantDto): Observable<ParticipantModel> {
        return this.api.createParticipant( this.selectedProjectId(), participant ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (created: ParticipantModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateParticipant (id: string, participant: ParticipantDto): Observable<ParticipantModel> {
        return this.api.updateParticipantById( this.selectedProjectId(), id, participant ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: ParticipantModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableParticipant (id: string): Observable<ParticipantModel> {
        return this.api.disableParticipantById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (disabled: ParticipantModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableParticipant (id: string): Observable<ParticipantModel> {
        return this.api.enableParticipantById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (enabled: ParticipantModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteParticipant (participant: ParticipantModel): Observable<void> {
        return this.api.deleteParticipantById( undefined, participant.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', participant ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, participant: ParticipantModel): void {
        this.onCommandSucceeded( 'participant', command, 'participants.notifications', 'pi pi-users', { firstName: participant?.firstName, lastName: participant?.lastName } )

        const page: PageModel<ParticipantModel> | undefined = this.participantsPage()
        this.fetchParticipantsPage( page?.pageNumber, page?.pageSize, true )
    }
}

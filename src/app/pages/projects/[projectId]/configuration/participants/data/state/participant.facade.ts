import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ParticipantDto } from '@pages/projects/[projectId]/configuration/participants/data/dto/participant.dto'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { NotificationModel } from '@shared/models/model/notification.model'
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

/**
 * Purpose: Public entry point of the participant domain for pages, components and guards.
 * Scope: Exposes the participant store as signals, forwards its queries and runs the participant commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class ParticipantFacade extends GenericProjectElementFacade {
    private readonly store: InstanceType<typeof ParticipantStore> = inject( ParticipantStore )

    private readonly api: ParticipantApi = inject( ParticipantApi )

    public readonly participantsPage: Signal<PageModel<ParticipantModel> | undefined> = this.store.participants.element

    public readonly participantsPageLoading: Signal<boolean> = this.store.participants.loading

    public readonly participantsPageSilentLoading: Signal<boolean> = this.store.participants.silentLoading

    public readonly participantsPageError: Signal<NotificationModel | undefined> = this.store.participants.error

    public readonly participantsPageResetSearch: Signal<boolean> = this.store.participants.params.resetSearch

    public readonly participantsPageTextSearchedParam: Signal<string | undefined> = this.store.participants.params.textSearched

    public readonly participantsPageStatusSearchedParam: Signal<string | undefined> = this.store.participants.params.statusSearched

    public readonly participantsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.participants.params.visibilitySearched

    public readonly participantMovementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element

    public readonly participantMovementsPageLoading: Signal<boolean> = this.store.movements.loading

    public readonly participantMovementsPageSilentLoading: Signal<boolean> = this.store.movements.silentLoading

    public readonly participantMovementsPageError: Signal<NotificationModel | undefined> = this.store.movements.error

    public readonly participantMovementsPageResetSearch: Signal<boolean> = this.store.movements.params.resetSearch

    public readonly participantMovementsPageTypeSearchedParam: Signal<string | undefined> = this.store.movements.params.typeSearched

    public readonly participantMovementsPageStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movements.params.startDateTimeSearched() ),
        )

    public readonly participantMovementsPageEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movements.params.endDateTimeSearched() ),
        )

    public readonly participantMovementsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.movements.params.visibilitySearched

    public readonly searchedUsersMetadata: Signal<SelectOptionModel<UserModel>[]> = this.store.metadata.searchedUsers

    public readonly searchedGroupsMetadata: Signal<SelectOptionModel<GroupModel>[]> = this.store.metadata.searchedGroups

    public readonly presencesStatusMetadata: Signal<SelectOptionModel<PresenceStatusEnum | undefined>[]> = this.store.metadata.presencesStatus

    public readonly visibilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed( (): SelectOptionModel<boolean | undefined>[] =>
            this.store.metadata.visibilities().map( (status: SelectOptionModel<boolean | undefined>): SelectOptionModel<boolean | undefined> => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }) ),
        )

    public fetchParticipantsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.participantsPageResetSearch() ? 0 : pageNumber
        this.store.fetchParticipantsPage( { projectId: this.selectedProjectId(), pageNumber: index, pageSize: pageSize } )
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
            this.store.updateParticipantsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                statusSearched: statusSearched,
                textSearched: textSearched,
            } )
        }
    }

    public fetchParticipantMovementsPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.participantMovementsPageResetSearch() ? 0 : pageNumber
        this.store.fetchParticipantMovementsPage( { projectId: this.selectedProjectId(), id: id, pageNumber: index, pageSize: pageSize } )
    }

    public fetchParticipantMovementsContent (movementIds: string[]): void {
        this.store.fetchParticipantMovementsContents( { projectId: this.selectedProjectId(), movementIds: movementIds } )
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
            this.store.updateParticipantMovementsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                currentMovements: false,
                linkedToActivity: undefined,
                typeSearched: typeSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } )
        }
    }

    public searchUsers (
        textSearched: string | undefined = undefined,
    ): void {
        this.store.searchUsers( { projectId: this.selectedProjectId(), textSearched: textSearched } )
    }

    public searchGroups (
        textSearched: string | undefined = undefined,
    ): void {
        this.store.searchGroups( { projectId: this.selectedProjectId(), textSearched: textSearched } )
    }

    public handleParticipantFirstPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'participant', 'create', 'delete' )
    }

    public handleParticipantCurrentPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'participant', 'update', 'disable', 'enable' )
    }

    public fetchParticipant (id: string): Observable<ParticipantModel> {
        return this.api.findParticipantById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
        )
    }

    public createParticipant (participant: ParticipantDto): Observable<ParticipantModel> {
        return this.api.createParticipant( this.selectedProjectId(), participant ).pipe(
            notifyUnavailableOnly( this.uiFacade ),
            tap( (created: ParticipantModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateParticipant (id: string, participant: ParticipantDto): Observable<ParticipantModel> {
        return this.api.updateParticipantById( this.selectedProjectId(), id, participant ).pipe(
            notifyUnavailableOnly( this.uiFacade ),
            tap( (updated: ParticipantModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableParticipant (id: string): Observable<ParticipantModel> {
        return this.api.disableParticipantById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (disabled: ParticipantModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableParticipant (id: string): Observable<ParticipantModel> {
        return this.api.enableParticipantById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (enabled: ParticipantModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteParticipant (participant: ParticipantModel): Observable<void> {
        return this.api.deleteParticipantById( undefined, participant.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', participant ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, participant: ParticipantModel): void {
        this.onCommandSucceeded( 'participant', command, 'participants.notifications', 'pi pi-users', { firstName: participant?.firstName, lastName: participant?.lastName } )

        const page: PageModel<ParticipantModel> | undefined = this.participantsPage()
        this.fetchParticipantsPage( page?.pageNumber, page?.pageSize )
    }
}

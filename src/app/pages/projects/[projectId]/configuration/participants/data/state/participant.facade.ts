import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { BrowserService } from '@core/browser/browser.service'
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
import { notifyOnError } from '@shared/helpers/rx.helper'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { UserModel } from '@shared/models/model/user.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'

/**
 * Purpose: Public entry point of the participant domain for pages, components and guards.
 * Scope: Exposes the participant store as signals, forwards its queries and runs the participant commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class ParticipantFacade extends GenericProjectElementFacade {
    private readonly store: InstanceType<typeof ParticipantStore> = inject( ParticipantStore )

    private readonly api: ParticipantApi = inject( ParticipantApi )

    private readonly browser: BrowserService = inject( BrowserService )

    public readonly participantsPage: Signal<PageModel<ParticipantModel> | undefined> = this.store.participants.element

    public readonly participantsPageLoading: Signal<boolean> = this.store.participants.loading

    public readonly participantsPageSilentLoading: Signal<boolean> = this.store.participants.silentLoading

    public readonly participantsPageError: Signal<NotificationModel | undefined> = this.store.participants.error

    public readonly participantsPageResetSearch: Signal<boolean> = this.store.participants.params.resetSearch

    public readonly participantsPageQueryParam: Signal<string | undefined> = this.store.participants.params.q

    public readonly participantsPageStatusParam: Signal<string | undefined> = this.store.participants.params.status

    public readonly participantsPageIsVisibleParam: Signal<boolean | undefined> = this.store.participants.params.isVisible

    public readonly participantMovementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element

    public readonly participantMovementsPageLoading: Signal<boolean> = this.store.movements.loading

    public readonly participantMovementsPageSilentLoading: Signal<boolean> = this.store.movements.silentLoading

    public readonly participantMovementsPageError: Signal<NotificationModel | undefined> = this.store.movements.error

    public readonly participantMovementsPageResetSearch: Signal<boolean> = this.store.movements.params.resetSearch

    public readonly participantMovementsPageTypeParam: Signal<string | undefined> = this.store.movements.params.type

    public readonly participantMovementsPageFromParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movements.params.from() ),
        )

    public readonly participantMovementsPageToParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movements.params.to() ),
        )

    public readonly participantMovementsPageIsVisibleParam: Signal<boolean | undefined> = this.store.movements.params.isVisible

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
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.participantsPageResetSearch() ? 0 : page
        this.store.fetchParticipantsPage( { projectId: this.selectedProjectId(), page: index, size: size } )
    }

    public inputPageSearchParameters (
        q: string | undefined,
        status: string | undefined,
        isVisible: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.participantsPageQueryParam() != q
                                     || this.participantsPageStatusParam() != status
                                     || this.participantsPageIsVisibleParam() != isVisible

        if (resetSearch) {
            this.store.updateParticipantsPageSearchParams( {
                resetSearch: resetSearch,
                isVisible: isVisible,
                status: status,
                q: q,
            } )
        }
    }

    public fetchParticipantMovementsPage (
        id: string,
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.participantMovementsPageResetSearch() ? 0 : page
        this.store.fetchParticipantMovementsPage( { projectId: this.selectedProjectId(), id: id, page: index, size: size } )
    }

    public reloadParticipantMovementsPage (id: string): void {
        this.store.fetchParticipantMovementsPage( { projectId: this.selectedProjectId(), id: id, ...CumulativePageHelper.reloadRequest( this.participantMovementsPage() ) } )
    }

    public inputMovementsPageSearchParameters (
        type: string | undefined,
        from: Date | undefined,
        to: Date | undefined,
        isVisible: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.participantMovementsPageTypeParam() != type
                                     || this.participantMovementsPageFromParam()?.toISOString() != from?.toISOString()
                                     || this.participantMovementsPageToParam()?.toISOString() != to?.toISOString()
                                     || this.participantMovementsPageIsVisibleParam() != isVisible

        if (resetSearch) {
            this.store.updateParticipantMovementsPageSearchParams( {
                resetSearch: resetSearch,
                isVisible: isVisible,
                isCurrent: false,
                hasActivity: undefined,
                type: type,
                from: from?.toISOString(),
                to: to?.toISOString(),
            } )
        }
    }

    public searchUsers (
        q: string | undefined = undefined,
    ): void {
        this.store.searchUsers( { projectId: this.selectedProjectId(), q: q } )
    }

    public searchGroups (
        q: string | undefined = undefined,
    ): void {
        this.store.searchGroups( { projectId: this.selectedProjectId(), q: q } )
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
            tap( (created: ParticipantModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateParticipant (id: string, participant: ParticipantDto, ifMatch?: string): Observable<ParticipantModel> {
        return this.api.updateParticipantById( this.selectedProjectId(), id, participant, ifMatch ).pipe(
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

    public exportParticipant (participant: ParticipantModel): Observable<unknown> {
        return this.api.exportParticipantById( this.selectedProjectId(), participant.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (data: unknown): void => this.browser.downloadJson( data, `registry-participant-${ participant.id }.json` ) ),
        )
    }

    public deleteParticipant (participant: ParticipantModel): Observable<void> {
        return this.api.deleteParticipantById( undefined, participant.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', participant ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, participant: ParticipantModel): void {
        this.onCommandSucceeded( 'participant', command, 'participants.notifications', { firstName: participant?.firstName, lastName: participant?.lastName } )

        this.store.fetchParticipantsPage( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.participantsPage() ) } )
    }
}

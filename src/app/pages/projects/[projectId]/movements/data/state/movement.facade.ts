import { SectionErrorsHelper } from '@shared/helpers/store/section-errors.helper'
import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { SelectOptionModel, SelectOptionGroupModel } from '@shared/models/model/select-option.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store'
import { GuestMovementDto } from '@pages/projects/[projectId]/movements/data/dto/guest-movement.dto'
import { MovementDto } from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'

/**
 * Purpose: Public entry point of the movement domain for pages, components and guards.
 * Scope: Exposes the movement store as signals, forwards its queries and runs the movement commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class MovementFacade extends GenericProjectElementFacade {
    private readonly store: InstanceType<typeof MovementStore> = inject( MovementStore )

    private readonly api: MovementApi = inject( MovementApi )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )
    private readonly datePipe: DateFormatPipe = inject( DateFormatPipe )

    public readonly metadataErrors: Signal<Record<string, NotificationModel | undefined>> = SectionErrorsHelper.metadata( this.store.sectionErrors )

    public readonly movementsContentsError: Signal<NotificationModel | undefined> = SectionErrorsHelper.of( this.store.sectionErrors, 'contents' )

    public readonly movementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element

    public readonly movementsPageLoading: Signal<boolean> = this.store.movements.loading

    public readonly movementsPageSilentLoading: Signal<boolean> = this.store.movements.silentLoading

    public readonly movementsPageError: Signal<NotificationModel | undefined> = this.store.movements.error

    private readonly movementsPageResetSearch: Signal<boolean> = this.store.movements.params.resetSearch

    public readonly movementsPageTypeParam: Signal<string | undefined> = this.store.movements.params.type

    public readonly movementsPageFromParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movements.params.from() ),
        )

    public readonly movementsPageToParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movements.params.to() ),
        )

    public readonly movementsPageIsVisibleParam: Signal<boolean | undefined> = this.store.movements.params.isVisible

    public readonly movementCommunicationsPage: Signal<PageModel<CommunicationModel> | undefined> = this.store.movementCommunications.element

    public readonly movementCommunicationsPageLoading: Signal<boolean> = this.store.movementCommunications.loading

    public readonly movementCommunicationsPageSilentLoading: Signal<boolean> = this.store.movementCommunications.silentLoading

    public readonly movementCommunicationsPageError: Signal<NotificationModel | undefined> = this.store.movementCommunications.error

    private readonly movementCommunicationsPageResetSearch: Signal<boolean> = this.store.movementCommunications.params.resetSearch

    public readonly movementCommunicationsPageQueryParam: Signal<string | undefined> = this.store.movementCommunications.params.q

    public readonly movementCommunicationsPageIsVisibleParam: Signal<boolean | undefined> = this.store.movementCommunications.params.isVisible

    public readonly movementCommunicationsPageFromParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movementCommunications.params.from() ),
        )

    public readonly movementCommunicationsPageToParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movementCommunications.params.to() ),
        )

    public readonly searchedReasonAndActivityMetadata: Signal<MovementReasonModel[]> = this.store.metadata.searchedReasonsAndActivities

    public readonly searchedParticipantAndGroupMetadata: Signal<SelectOptionGroupModel<ParticipantModel | GroupModel>[]> = this.store.metadata.searchedParticipantsAndGroups

    public readonly searchedVehicleMetadata: Signal<SelectOptionModel<VehicleModel>[]> = this.store.metadata.searchedVehicles

    public readonly movementTypesMetadata: Signal<SelectOptionModel<MovementTypeEnum | undefined>[]> = this.store.metadata.types

    public readonly participantTypesMetadata: Signal<SelectOptionModel<ParticipantTypeEnum>[]> = this.store.metadata.participantTypes

    public readonly visibilitiesMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed( () =>
            this.store.metadata.visibilities().map( (status: SelectOptionModel<boolean | undefined>) => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }) ),
        )

    public fetchMovementsPage (
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.movementsPageResetSearch() ? 0 : page
        this.store.fetchMovementsPage( { projectId: this.selectedProjectId(), page: index, size: size } )
    }

    public fetchMovementsContents (movementIds: string[]): void {
        this.store.fetchMovementsContents( { projectId: this.selectedProjectId(), movementIds: movementIds } )
    }

    public inputPageSearchParameters (
        type: string | undefined,
        from: Date | undefined,
        to: Date | undefined,
        isVisible: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.movementsPageTypeParam() != type
                                     || this.movementsPageFromParam()?.toISOString() != from?.toISOString()
                                     || this.movementsPageToParam()?.toISOString() != to?.toISOString()
                                     || this.movementsPageIsVisibleParam() != isVisible

        if (resetSearch) {
            this.store.updateMovementsPageSearchParams( {
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

    public fetchMovementCommunicationsPage (
        id: string,
        page: number | undefined,
        size: number | undefined,
    ): void {
        const index: number | undefined = this.movementCommunicationsPageResetSearch() ? 0 : page
        this.store.fetchMovementCommunicationsPage( { projectId: this.selectedProjectId(), id: id, page: index, size: size } )
    }

    public loadOlderMovementCommunications (id: string): void {
        const shown: PageModel<CommunicationModel> | undefined = this.movementCommunicationsPage()
        if (shown?.hasNext) {
            this.store.fetchMovementCommunicationsPage( { projectId: this.selectedProjectId(), id: id, page: shown.page + 1, size: shown.size } )
        }
    }

    public reloadMovementCommunications (id: string): void {
        this.store.fetchMovementCommunicationsPage( { projectId: this.selectedProjectId(), id: id, ...CumulativePageHelper.reloadRequest( this.movementCommunicationsPage() ) } )
    }

    public inputMovementCommunicationsPageSearchParameters (
        q: string | undefined,
        isVisible: boolean | undefined,
        from: Date | undefined,
        to: Date | undefined,
    ): void {
        const resetSearch: boolean = this.movementCommunicationsPageQueryParam() != q
                                     || this.movementCommunicationsPageIsVisibleParam() != isVisible
                                     || this.movementCommunicationsPageFromParam()?.toISOString() != from?.toISOString()
                                     || this.movementCommunicationsPageToParam()?.toISOString() != to?.toISOString()

        if (resetSearch) {
            this.store.updateMovementCommunicationsPageSearchParams( {
                resetSearch: resetSearch,
                isVisible: isVisible,
                q: q,
                from: from?.toISOString(),
                to: to?.toISOString(),
            } )
        }
    }

    public searchReasonsAndActivities (
        q: string | undefined = undefined,
        type: string,
        contentType: ParticipantTypeEnum,
    ): void {
        this.store.searchReasonsAndActivities( {
            projectId: this.selectedProjectId(),
            q: q,
            type: type,
            contentType: contentType,
        } )
    }

    public searchParticipantsAndGroups (
        contentType: ParticipantTypeEnum,
        q: string | undefined = undefined,
    ): void {
        this.store.searchParticipantsAndGroups( {
            projectId: this.selectedProjectId(),
            contentType: contentType,
            q: q,
        } )
    }

    public searchVehicles (q: string | undefined = undefined): void {
        this.store.searchVehicles( { projectId: this.selectedProjectId(), q: q } )
    }

    public fetchMovementTypes (): void {
        if (this.movementTypesMetadata().length === 0) {
            this.store.fetchMovementTypes()
        }
    }

    public fetchParticipantTypes (): void {
        if (this.participantTypesMetadata().length === 0) {
            this.store.fetchParticipantTypes()
        }
    }

    public handleMovementFirstPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'movement', 'create', 'delete' )
    }

    public handleMovementCurrentPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'movement', 'update', 'disable', 'enable' )
    }

    public handleMovementChanges (): Observable<unknown> {
        return this.commandEvents.on( 'movement', 'create', 'update', 'delete', 'disable', 'enable' )
    }

    public fetchMovement (id: string): Observable<MovementModel> {
        return this.api.findMovementById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
        )
    }

    public createRegisteredMovement (movement: MovementDto): Observable<MovementModel> {
        return this.api.createMovement( this.selectedProjectId(), movement ).pipe(
            tap( (created: MovementModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateRegisteredMovement (id: string, movement: MovementDto, ifMatch?: string): Observable<MovementModel> {
        return this.api.updateMovementById( this.selectedProjectId(), id, movement, ifMatch ).pipe(
            tap( (updated: MovementModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public createGuestMovement (movement: GuestMovementDto): Observable<MovementModel> {
        return this.api.createGuestsMovement( this.selectedProjectId(), movement ).pipe(
            tap( (created: MovementModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateGuestMovement (id: string, movement: GuestMovementDto, ifMatch?: string): Observable<MovementModel> {
        return this.api.updateGuestsMovementById( this.selectedProjectId(), id, movement, ifMatch ).pipe(
            tap( (updated: MovementModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableMovement (id: string): Observable<MovementModel> {
        return this.api.disableMovementById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (disabled: MovementModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableMovement (id: string): Observable<MovementModel> {
        return this.api.enableMovementById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (enabled: MovementModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteMovement (movement: MovementModel): Observable<void> {
        return this.api.deleteMovementById( undefined, movement.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', movement ) ),
        )
    }

    private onCommandSuccess (command: CommandEvent, movement: MovementModel): void {
        const prefix: string = `movements.notifications.${ command === 'update' ? 'edit' : command }.${ movement.type.value }`
        this.notifyMessage(
            SeverityEnum.SUCCESS,
            `${ prefix }.title`,
            command === 'create'
            ? this.pluralTranslationPipe.transform( `${ prefix }.message`, movement.content )
            : `${ prefix }.message`,
            'pi pi-sort-alt',
            {
                datetime: this.datePipe.transform( movement?.dateTime, 'datetime' ),
                participants: movement.content?.length ?? 0,
            },
        )
        this.commandEvents.emit( 'movement', command )

        this.reloadMovementsPage()
    }

    public reloadMovementsPage (): void {
        this.store.fetchMovementsPage( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.movementsPage() ) } )
    }
}

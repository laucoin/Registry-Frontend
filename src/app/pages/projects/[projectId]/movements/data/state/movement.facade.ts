import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { SelectItem, SelectItemGroup, ToastMessageOptions } from 'primeng/api'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store'
import { MovementDto } from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/rx.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { CommunicationModel } from '@shared/models/model/communication.model'

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

    public readonly movementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element

    public readonly movementsPageLoading: Signal<boolean> = this.store.movements.loading

    public readonly movementsPageSilentLoading: Signal<boolean> = this.store.movements.silentLoading

    public readonly movementsPageError: Signal<ToastMessageOptions | undefined> = this.store.movements.error

    private readonly movementsPageResetSearch: Signal<boolean> = this.store.movements.params.resetSearch

    public readonly movementsPageTypeSearchedParam: Signal<string | undefined> = this.store.movements.params.typeSearched

    public readonly movementsPageStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movements.params.startDateTimeSearched() ),
        )

    public readonly movementsPageEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movements.params.endDateTimeSearched() ),
        )

    public readonly movementsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.movements.params.visibilitySearched

    public readonly movementCommunicationsPage: Signal<PageModel<CommunicationModel> | undefined> = this.store.movementCommunications.element

    public readonly movementCommunicationsPageLoading: Signal<boolean> = this.store.movementCommunications.loading

    public readonly movementCommunicationsPageSilentLoading: Signal<boolean> = this.store.movementCommunications.silentLoading

    public readonly movementCommunicationsPageError: Signal<ToastMessageOptions | undefined> = this.store.movementCommunications.error

    private readonly movementCommunicationsPageResetSearch: Signal<boolean> = this.store.movementCommunications.params.resetSearch

    public readonly movementCommunicationsPageTextSearchedParam: Signal<string | undefined> = this.store.movementCommunications.params.textSearched

    public readonly movementCommunicationsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.movementCommunications.params.visibilitySearched

    public readonly movementCommunicationsPageStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movementCommunications.params.startDateTimeSearched() ),
        )

    public readonly movementCommunicationsPageEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.movementCommunications.params.endDateTimeSearched() ),
        )

    public readonly searchedReasonAndActivityMetadata: Signal<MovementReasonModel[]> = this.store.metadata.searchedReasonsAndActivities

    public readonly searchedParticipantAndGroupMetadata: Signal<SelectItemGroup<ParticipantModel | GroupModel>[]> = this.store.metadata.searchedParticipantsAndGroups

    public readonly searchedVehicleMetadata: Signal<SelectItem<VehicleModel>[]> = this.store.metadata.searchedVehicles

    public readonly movementTypesMetadata: Signal<SelectItem<MovementTypeEnum | undefined>[]> = this.store.metadata.types

    public readonly participantTypesMetadata: Signal<SelectItem<ParticipantTypeEnum>[]> = this.store.metadata.participantTypes

    public readonly visibilitiesMetadata: Signal<SelectItem<boolean | undefined>[]> = computed( () =>
            this.store.metadata.visibilities().map( (status: SelectItem<boolean | undefined>) => ({
                ...status,
                label: this.translateLabel( status.label! ),
            }) ),
        )

    public fetchMovementsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.movementsPageResetSearch() ? 0 : pageNumber
        this.store.fetchMovementsPage( { projectId: this.selectedProjectId(), pageNumber: index, pageSize: pageSize } )
    }

    public fetchMovementsContents (movementIds: string[]): void {
        this.store.fetchMovementsContents( { projectId: this.selectedProjectId(), movementIds: movementIds } )
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
            this.store.updateMovementsPageSearchParams( {
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

    public fetchMovementCommunicationsPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.movementCommunicationsPageResetSearch() ? 0 : pageNumber
        this.store.fetchMovementCommunicationsPage( { projectId: this.selectedProjectId(), id: id, pageNumber: index, pageSize: pageSize } )
    }

    public inputMovementCommunicationsPageSearchParameters (
        textSearched: string | undefined,
        visibilitySearched: boolean | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
    ): void {
        const resetSearch: boolean = this.movementCommunicationsPageTextSearchedParam() != textSearched
                                     || this.movementCommunicationsPageVisibilitySearchedParam() != visibilitySearched
                                     || this.movementCommunicationsPageStartDateTimeSearchedParam() != startDateTimeSearched?.toISOString()
                                     || this.movementCommunicationsPageEndDateTimeSearchedParam() != endDateTimeSearched?.toISOString()

        if (resetSearch) {
            this.store.updateMovementCommunicationsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                textSearched: textSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } )
        }
    }

    public searchReasonsAndActivities (
        textSearched: string | undefined = undefined,
        typeSearched: string,
        contentTypeSearched: ParticipantTypeEnum,
    ): void {
        this.store.searchReasonsAndActivities( {
            projectId: this.selectedProjectId(),
            textSearched: textSearched,
            typeSearched: typeSearched,
            contentTypeSearched: contentTypeSearched,
        } )
    }

    public searchParticipantsAndGroups (
        contentTypeSearched: ParticipantTypeEnum,
        textSearched: string | undefined = undefined,
    ): void {
        this.store.searchParticipantsAndGroups( {
            projectId: this.selectedProjectId(),
            contentTypeSearched: contentTypeSearched,
            textSearched: textSearched,
        } )
    }

    public searchVehicles (textSearched: string | undefined = undefined): void {
        this.store.searchVehicles( { projectId: this.selectedProjectId(), textSearched: textSearched } )
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

    public createMovement (movement: MovementDto): Observable<MovementModel> {
        const request: Observable<MovementModel> = movement.contentType === ParticipantTypeEnum.REGISTERED
            ? this.api.createMovement( this.selectedProjectId(), movement )
            : this.api.createGuestsMovement( this.selectedProjectId(), movement )

        return request.pipe(
            notifyUnavailableOnly( this.uiFacade ),
            tap( (created: MovementModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateMovement (id: string, movement: MovementDto): Observable<MovementModel> {
        const request: Observable<MovementModel> = movement.contentType === ParticipantTypeEnum.REGISTERED
            ? this.api.updateMovementById( this.selectedProjectId(), id, movement )
            : this.api.updateGuestsMovementById( this.selectedProjectId(), id, movement )

        return request.pipe(
            notifyUnavailableOnly( this.uiFacade ),
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

        const page: PageModel<MovementModel> | undefined = this.movementsPage()
        this.fetchMovementsPage( page?.pageNumber, page?.pageSize )
    }
}

import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { SelectItem, SelectItemGroup, ToastMessageOptions } from 'primeng/api'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store'
import {
    FetchMovementCommunicationsPage,
    FetchMovementsContent,
    FetchMovementsPage,
    FetchMovementTypes,
    FetchParticipantTypes,
    SearchParticipantsAndGroups,
    SearchReasonsAndActivities,
    SearchVehicles,
    StartMovementCommunicationsPageLoader,
    StartMovementsPageLoader,
    StopMovementCommunicationsPageLoader,
    StopMovementsPageLoader,
    UpdateMovementCommunicationsPageSearchParams,
    UpdateMovementsPageSearchParams,
} from '@pages/projects/[projectId]/movements/data/state/movement.action'
import { MovementDto } from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { DateUtil } from '@shared/helpers/util/date.util'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/util/rx.util'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { MovementReasonModel } from '@pages/projects/[projectId]/movements/data/model/movement-reason.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'

@Injectable()
export class MovementFacade extends GenericProjectElementFacade {
    private readonly api: MovementApi = inject( MovementApi )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )
    private readonly datePipe: DateFormatPipe = inject( DateFormatPipe )

    public get movementsPage (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( MovementStore.movementsPage )
    }

    public get movementsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( MovementStore.movementsPageLoading )
    }

    public get movementsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( MovementStore.movementsPageSilentLoading )
    }

    public get movementsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( MovementStore.movementsPageError )
    }

    private get movementsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( MovementStore.movementsPageResetSearch )
    }

    public get movementsPageTypeSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( MovementStore.movementsPageTypeSearchedParam )
    }

    public get movementsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( MovementStore.movementsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get movementsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( MovementStore.movementsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get movementsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( MovementStore.movementsPageVisibilitySearchedParam )
    }

    public get movementCommunicationsPage (): Signal<PageModel<CommunicationModel> | undefined> {
        return this.ngStore.selectSignal( MovementStore.movementCommunicationsPage )
    }

    public get movementCommunicationsPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( MovementStore.movementCommunicationsPageLoading )
    }

    public get movementCommunicationsPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( MovementStore.movementCommunicationsPageSilentLoading )
    }

    public get movementCommunicationsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( MovementStore.movementCommunicationsPageError )
    }

    private get movementCommunicationsPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( MovementStore.movementCommunicationsPageResetSearch )
    }

    public get movementCommunicationsPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( MovementStore.movementCommunicationsPageTextSearchedParam )
    }

    public get movementCommunicationsPageVisibilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( MovementStore.movementCommunicationsPageVisibilitySearchedParam )
    }

    public get movementCommunicationsPageStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( MovementStore.movementCommunicationsPageStartDateTimeSearchedParam )() ),
        )
    }

    public get movementCommunicationsPageEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( MovementStore.movementCommunicationsPageEndDateTimeSearchedParam )() ),
        )
    }

    public get searchedReasonAndActivityMetadata (): Signal<MovementReasonModel[]> {
        return this.ngStore.selectSignal( MovementStore.searchedReasonAndActivityMetadata )
    }

    public get searchedParticipantAndGroupMetadata (): Signal<SelectItemGroup<ParticipantModel | GroupModel>[]> {
        return this.ngStore.selectSignal( MovementStore.searchedParticipantAndGroupMetadata )
    }

    public get searchedVehicleMetadata (): Signal<SelectItem<VehicleModel>[]> {
        return this.ngStore.selectSignal( MovementStore.searchedVehicleMetadata )
    }

    public get movementTypesMetadata (): Signal<SelectItem<MovementTypeEnum | undefined>[]> {
        return this.ngStore.selectSignal( MovementStore.movementTypesMetadata )
    }

    public get participantTypesMetadata (): Signal<SelectItem<ParticipantTypeEnum>[]> {
        return this.ngStore.selectSignal( MovementStore.participantTypesMetadata )
    }

    public get visibilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( () =>
            this.ngStore.selectSignal( MovementStore.visibilitiesMetadata )().map( (status: SelectItem<boolean | undefined>) => ({
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
                currentMovements: false,
                linkedToActivity: undefined,
                typeSearched: typeSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public startMovementCommunicationsPageLoader (): void {
        this.ngStore.dispatch( StartMovementCommunicationsPageLoader )
    }

    public stopMovementCommunicationsPageLoader (): void {
        this.ngStore.dispatch( StopMovementCommunicationsPageLoader )
    }

    public fetchMovementCommunicationsPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        const index: number | undefined = this.movementCommunicationsPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchMovementCommunicationsPage(
            this.selectedProjectId(),
            id,
            index,
            pageSize,
            force,
        ) )
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
            this.ngStore.dispatch( new UpdateMovementCommunicationsPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                textSearched: textSearched,
                startDateTimeSearched: startDateTimeSearched?.toISOString(),
                endDateTimeSearched: endDateTimeSearched?.toISOString(),
            } ) )
        }
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
            notifyOnError( this.registryFacade ),
        )
    }

    public createMovement (movement: MovementDto): Observable<MovementModel> {
        const request: Observable<MovementModel> = movement.contentType === ParticipantTypeEnum.REGISTERED
            ? this.api.createMovement( this.selectedProjectId(), movement )
            : this.api.createGuestsMovement( this.selectedProjectId(), movement )

        return request.pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (created: MovementModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateMovement (id: string, movement: MovementDto): Observable<MovementModel> {
        const request: Observable<MovementModel> = movement.contentType === ParticipantTypeEnum.REGISTERED
            ? this.api.updateMovementById( this.selectedProjectId(), id, movement )
            : this.api.updateGuestsMovementById( this.selectedProjectId(), id, movement )

        return request.pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: MovementModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableMovement (id: string): Observable<MovementModel> {
        return this.api.disableMovementById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (disabled: MovementModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableMovement (id: string): Observable<MovementModel> {
        return this.api.enableMovementById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (enabled: MovementModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteMovement (movement: MovementModel): Observable<void> {
        return this.api.deleteMovementById( undefined, movement.id ).pipe(
            notifyOnError( this.registryFacade ),
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
        this.fetchMovementsPage( page?.pageNumber, page?.pageSize, true )
    }
}

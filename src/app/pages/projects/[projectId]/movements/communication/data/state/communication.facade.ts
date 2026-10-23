import { SectionErrorsHelper } from '@shared/helpers/store/section-errors.helper'
import { toObservable } from '@angular/core/rxjs-interop'
import { Injectable, Signal, inject } from '@angular/core'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { CommunicationStore } from '@pages/projects/[projectId]/movements/communication/data/state/communication.store'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { CommandEvent } from '@shared/helpers/facade/command-event.service'
import { Observable, tap } from 'rxjs'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { CommunicationDto } from '@pages/projects/[projectId]/movements/communication/data/dto/communication.dto'
import { MovementModel } from '@shared/models/model/movement.model'
import { AlertModel } from '@shared/models/model/alert.model'


/**
 * Purpose: Public entry point of the communication domain for pages, components and guards.
 * Scope: Exposes the communication store as signals, forwards its queries and runs the communication commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class CommunicationFacade extends GenericProjectElementFacade {
    private readonly store: InstanceType<typeof CommunicationStore> = inject( CommunicationStore )

    private readonly api: CommunicationApi = inject( CommunicationApi )
    private readonly datePipe: DateFormatPipe = inject( DateFormatPipe )

    public readonly metadataErrors: Signal<Record<string, NotificationModel | undefined>> = SectionErrorsHelper.metadata( this.store.sectionErrors )

    public readonly communicationError: Signal<NotificationModel | undefined> = this.store.communication.error

    public readonly communication: Signal<CommunicationModel | undefined> = this.store.communication.element

    public readonly communication$: Observable<CommunicationModel | undefined> = toObservable( this.communication )

    public readonly communicationLoading: Signal<boolean> = this.store.communication.loading

    public readonly searchedMovementsMetadata: Signal<SelectOptionModel<MovementModel>[]> = this.store.metadata.searchedMovements

    public readonly searchedAlertsMetadata: Signal<SelectOptionModel<AlertModel>[]> = this.store.metadata.searchedAlerts

    public fetchCommunication (id: string): void {
        this.store.fetchCommunication( { projectId: this.selectedProjectId(), id: id } )
    }

    public searchMovements (
        q: string | undefined = undefined,
    ): void {
        this.store.searchMovements( { projectId: this.selectedProjectId(), q: q } )
    }

    public searchAlerts (
        q: string | undefined = undefined,
    ): void {
        this.store.searchAlerts( { projectId: this.selectedProjectId(), q: q } )
    }

    public resetCommunication (): void {
        this.store.resetCommunication()
    }

    public handleCommunicationFirstPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'communication', 'create', 'delete' )
    }

    public handleCommunicationCurrentPageReload (): Observable<unknown> {
        return this.commandEvents.on( 'communication', 'update', 'disable', 'enable' )
    }

    public createCommunication (communication: CommunicationDto): Observable<CommunicationModel> {
        return this.api.createCommunication( this.selectedProjectId(), communication ).pipe(
            tap( (created: CommunicationModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateCommunication (id: string, communication: CommunicationDto, ifMatch?: string): Observable<CommunicationModel> {
        return this.api.updateCommunicationById( this.selectedProjectId(), id, communication, ifMatch ).pipe(
            tap( (updated: CommunicationModel): void => this.onCommandSuccess( 'update', updated ) ),
        )
    }

    public disableCommunication (id: string): Observable<CommunicationModel> {
        return this.api.disableCommunicationById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (disabled: CommunicationModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableCommunication (id: string): Observable<CommunicationModel> {
        return this.api.enableCommunicationById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (enabled: CommunicationModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteCommunication (communication: CommunicationModel): Observable<void> {
        return this.api.deleteCommunicationById( undefined, communication.id ).pipe(
            notifyOnError( this.uiFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', communication ) ),
        )
    }

    // Creating or editing a communication is silent (the form resets itself); the other commands notify.
    private onCommandSuccess (command: CommandEvent, communication: CommunicationModel): void {
        if (command !== 'create' && command !== 'update') {
            this.onCommandSucceeded(
                'communication',
                command,
                'communications.notifications',
                'pi pi-sort-alt',
                { datetime: this.datePipe.transform( communication?.dateTime, 'datetime' ) },
            )
        } else {
            this.commandEvents.emit( 'communication', command )
        }
    }
}

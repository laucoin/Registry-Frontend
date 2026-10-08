import { computed, inject, Injectable, Signal } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { VehicleDto } from '@pages/projects/[projectId]/configuration/vehicles/data/dto/vehicle.dto'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store'
import { GenericProjectElementFacade } from '@shared/helpers/facade/generic-project-element.facade'
import { MovementModel } from '@shared/models/model/movement.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api'
import { notifyOnError, notifyUnavailableOnly } from '@shared/helpers/rx.helper'

@Injectable()
export class VehicleFacade extends GenericProjectElementFacade {
    private readonly api: VehicleApi = inject( VehicleApi )

    private readonly store: InstanceType<typeof VehicleStore> = inject( VehicleStore )

    public readonly vehiclesPage: Signal<PageModel<VehicleModel> | undefined> = this.store.vehicles.element
    public readonly vehiclesPageLoading: Signal<boolean> = this.store.vehicles.loading
    public readonly vehiclesPageSilentLoading: Signal<boolean> = this.store.vehicles.silentLoading
    public readonly vehiclesPageError: Signal<ToastMessageOptions | undefined> = this.store.vehicles.error
    public readonly vehiclesPageResetSearch: Signal<boolean> = this.store.vehicles.params.resetSearch
    public readonly vehiclesPageTextSearchedParam: Signal<string | undefined> = this.store.vehicles.params.textSearched
    public readonly vehiclesPageDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.vehicles.params.dateTimeSearched() ),
    )
    public readonly vehiclesPageStatusSearchedParam: Signal<boolean | undefined> = this.store.vehicles.params.statusSearched
    public readonly vehiclesPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.vehicles.params.visibilitySearched

    public readonly vehicleMovementsPage: Signal<PageModel<MovementModel> | undefined> = this.store.movements.element
    public readonly vehicleMovementsPageLoading: Signal<boolean> = this.store.movements.loading
    public readonly vehicleMovementsPageSilentLoading: Signal<boolean> = this.store.movements.silentLoading
    public readonly vehicleMovementsPageError: Signal<ToastMessageOptions | undefined> = this.store.movements.error
    private readonly vehicleMovementsPageResetSearch: Signal<boolean> = this.store.movements.params.resetSearch
    public readonly vehicleMovementsPageTypeSearchedParam: Signal<string | undefined> = this.store.movements.params.typeSearched
    public readonly vehicleMovementsPageStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.movements.params.startDateTimeSearched() ),
    )
    public readonly vehicleMovementsPageEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
        DateHelper.buildDate( this.store.movements.params.endDateTimeSearched() ),
    )
    public readonly vehicleMovementsPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.movements.params.visibilitySearched

    public readonly presencesStatusMetadata: Signal<SelectItem<PresenceStatusEnum | undefined>[]> = this.store.metadata.presencesStatus
    public readonly visibilitiesMetadata: Signal<SelectItem<boolean | undefined>[]> = computed( (): SelectItem<boolean | undefined>[] =>
        this.store.metadata.visibilities().map(
            (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...status,
                label: this.translateService.translate( status.label! ),
            }),
        ),
    )

    public fetchVehiclesPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.vehiclesPageResetSearch() ? 0 : pageNumber
        this.store.fetchVehiclesPage( { projectId: this.selectedProjectId(), pageNumber: index, pageSize: pageSize } )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        statusSearched: boolean | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.vehiclesPageTextSearchedParam() != textSearched
                                     || this.vehiclesPageDateTimeSearchedParam() != dateTimeSearched?.toISOString()
                                     || this.vehiclesPageStatusSearchedParam() != statusSearched
                                     || this.vehiclesPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.store.updateVehiclesPageSearchParams( {
                resetSearch: resetSearch,
                visibilitySearched: visibilitySearched,
                textSearched: textSearched,
                statusSearched: statusSearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } )
        }
    }

    public fetchVehicleMovementsPage (
        id: string,
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.vehicleMovementsPageResetSearch() ? 0 : pageNumber
        this.store.fetchVehicleMovementsPage( { projectId: this.selectedProjectId(), id: id, pageNumber: index, pageSize: pageSize } )
    }

    public fetchVehicleMovementsContent (movementIds: string[]): void {
        this.store.fetchVehicleMovementsContents( { projectId: this.selectedProjectId(), movementIds: movementIds } )
    }

    public inputMovementsPageSearchParameters (
        typeSearched: string | undefined,
        startDateTimeSearched: Date | undefined,
        endDateTimeSearched: Date | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.vehicleMovementsPageTypeSearchedParam() != typeSearched
                                     || this.vehicleMovementsPageStartDateTimeSearchedParam() != startDateTimeSearched?.toISOString()
                                     || this.vehicleMovementsPageEndDateTimeSearchedParam() != endDateTimeSearched?.toISOString()
                                     || this.vehicleMovementsPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.store.updateVehicleMovementsPageSearchParams( {
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

    public fetchVehicle (id: string): Observable<VehicleModel> {
        return this.api.findVehicleById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
        )
    }

    public createVehicle (vehicle: VehicleDto): Observable<VehicleModel> {
        return this.api.createVehicle( this.selectedProjectId(), vehicle ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (created: VehicleModel): void => this.onCommandSuccess( 'create', created ) ),
        )
    }

    public updateVehicle (id: string, vehicle: VehicleDto): Observable<VehicleModel> {
        return this.api.updateVehicleById( this.selectedProjectId(), id, vehicle ).pipe(
            notifyUnavailableOnly( this.registryFacade ),
            tap( (updated: VehicleModel): void => this.onCommandSuccess( 'edit', updated ) ),
        )
    }

    public disableVehicle (id: string): Observable<VehicleModel> {
        return this.api.disableVehicleById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (disabled: VehicleModel): void => this.onCommandSuccess( 'disable', disabled ) ),
        )
    }

    public enableVehicle (id: string): Observable<VehicleModel> {
        return this.api.enableVehicleById( this.selectedProjectId(), id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (enabled: VehicleModel): void => this.onCommandSuccess( 'enable', enabled ) ),
        )
    }

    public deleteVehicle (vehicle: VehicleModel): Observable<void> {
        return this.api.deleteVehicleById( undefined, vehicle.id ).pipe(
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', vehicle ) ),
        )
    }

    private onCommandSuccess (command: string, vehicle: VehicleModel): void {
        this.notifySuccess( `vehicles.notifications.${ command }`, 'pi pi-users', {
            registration: vehicle?.licensePlate,
            brand: vehicle?.brand,
            model: vehicle?.model,
        } )

        const page: PageModel<VehicleModel> | undefined = this.vehiclesPage()
        this.fetchVehiclesPage( page?.pageNumber, page?.pageSize )
    }
}

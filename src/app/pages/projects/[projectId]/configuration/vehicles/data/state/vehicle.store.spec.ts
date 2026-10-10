import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api'
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

describe( 'VehicleStore', () => {
    let store: InstanceType<typeof VehicleStore>
    let findVehicles: Mock<VehicleApi['findVehicles']>
    let findVehicleMovements: Mock<VehicleApi['findVehicleMovements']>
    let findMovementsContents: Mock<MovementApi['findMovementsContents']>
    let getPresencesStatus: Mock<MetadataApi['getPresencesStatus']>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let langChanges: Subject<string>

    beforeEach( () => {
        findVehicles = vi.fn()
        findVehicleMovements = vi.fn()
        findMovementsContents = vi.fn( () => of( [] ) )
        getPresencesStatus = vi.fn( () => of( [ { label: 'In', value: PresenceStatusEnum.IN } ] ) )
        setGlobalError = vi.fn()
        langChanges = new Subject<string>()
        TestBed.configureTestingModule( {
            providers: [
                VehicleStore,
                { provide: VehicleApi, useValue: { findVehicles, findVehicleMovements } },
                { provide: MovementApi, useValue: { findMovementsContents } },
                { provide: MetadataApi, useValue: { getPresencesStatus } },
                { provide: ErrorReporter, useValue: { setGlobalError, notify: vi.fn() } },
                { provide: TranslocoService, useValue: { langChanges$: langChanges.asObservable() } },
            ],
        } )
        store = TestBed.inject( VehicleStore )
    } )

    it( 'loads the presence statuses on init with an empty option first', () => {
        // Arrange
        const expectedFirst: unknown = { label: '-', value: undefined }

        // Act
        const statuses: unknown[] = store.metadata.presencesStatus()

        // Assert
        expect( statuses ).toHaveLength( 2 )
        expect( statuses[ 0 ] ).toEqual( expectedFirst )
    } )

    it( 'reloads the presence statuses when the language changes but not on the initial language', () => {
        // Arrange
        langChanges.next( 'fr' )
        const callsAfterInitial: number = getPresencesStatus.mock.calls.length

        // Act
        langChanges.next( 'en' )

        // Assert
        expect( callsAfterInitial ).toBe( 1 )
        expect( getPresencesStatus ).toHaveBeenCalledTimes( 2 )
    } )

    it( 'stores the fetched vehicles page', () => {
        // Arrange
        findVehicles.mockReturnValue( of( pageOf<VehicleModel>( [ { id: 'v1' } as VehicleModel ] ) ) )

        // Act
        store.fetchVehiclesPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.vehicles.element()?.content ).toHaveLength( 1 )
        expect( store.vehicles.loading() ).toBe( false )
    } )

    it( 'keeps a failed vehicles fetch in the vehicles block', () => {
        // Arrange
        findVehicles.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchVehiclesPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.vehicles.error()?.summary ).toBe( 'Title' )
    } )

    it( 'reports a 503 on the vehicles fetch as the global error', () => {
        // Arrange
        findVehicles.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchVehiclesPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
    } )

    it( 'loads the movements of a vehicle and merges their contents', () => {
        // Arrange
        findVehicleMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
        findMovementsContents.mockReturnValue( of( [ { first: 'm1', second: [ { id: 'c1' } as unknown as MovementContentModel ] } ] ) )

        // Act
        store.fetchVehicleMovementsPage( { projectId: 'p1', id: 'v1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( findMovementsContents ).toHaveBeenCalledWith( 'p1', [ 'm1' ], false )
        expect( store.movements.element()?.content[ 0 ].content ).toHaveLength( 1 )
    } )

    it( 'keeps a failed movements fetch in the movements block only', () => {
        // Arrange
        findVehicleMovements.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchVehicleMovementsPage( { projectId: 'p1', id: 'v1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.movements.error()?.summary ).toBe( 'Title' )
        expect( store.vehicles.error() ).toBeUndefined()
    } )
} )

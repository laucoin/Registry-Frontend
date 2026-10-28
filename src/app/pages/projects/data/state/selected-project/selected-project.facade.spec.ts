import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { AlertApi } from '@pages/projects/[projectId]/alerts/data/state/alert.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ProjectStatusModel } from '@shared/models/model/project-status.model'
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store'
import { pageOf, projectOptionChecker } from '@shared/helpers/testing/test-fixtures'
import { AlertModel } from '@shared/models/model/alert.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ProjectModel } from '@shared/models/model/project.model'

describe( 'SelectedProjectFacade', () => {
    let facade: SelectedProjectFacade
    let findMovements: Mock<MovementApi['findMovements']>
    let findParticipantsStatus: Mock<MovementApi['findParticipantsStatus']>
    let findVehiclesStatus: Mock<MovementApi['findVehiclesStatus']>
    let findParticipantsBirthdays: Mock<ParticipantApi['findParticipantsBirthdays']>
    let findPlannedArrivals: Mock<MovementApi['findPlannedArrivals']>
    let findPlannedDepartures: Mock<MovementApi['findPlannedDepartures']>
    let findAlerts: Mock<AlertApi['findAlerts']>
    let selectedProject: WritableSignal<ProjectModel | undefined>

    beforeEach( () => {
        findMovements = vi.fn( () => of( pageOf<MovementModel>( [] ) ) )
        findParticipantsStatus = vi.fn( () => of( { guests: 1 } as unknown as ProjectStatusModel ) )
        findVehiclesStatus = vi.fn( () => of( { total: 1 } as unknown as VehicleStatusModel ) )
        findParticipantsBirthdays = vi.fn( () => of( [] ) )
        findPlannedArrivals = vi.fn( () => of( [] ) )
        findPlannedDepartures = vi.fn( () => of( [] ) )
        findAlerts = vi.fn( () => of( pageOf<AlertModel>( [] ) ) )
        selectedProject = signal<ProjectModel | undefined>( { id: 'p1', options: [] } as unknown as ProjectModel )
        TestBed.configureTestingModule( {
            providers: [
                SelectedProjectFacade,
                SelectedProjectStore,
                { provide: MovementApi, useValue: { findPlannedArrivals, findPlannedDepartures, findMovements, findParticipantsStatus, findVehiclesStatus, findMovementsContents: vi.fn( () => of( [] ) ) } },
                { provide: AlertApi, useValue: { findAlerts } },
                { provide: ParticipantApi, useValue: { findParticipantsBirthdays, findParticipants: vi.fn( () => of( pageOf<ParticipantModel>( [ { id: 'pa1' } as ParticipantModel ] ) ) ) } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ), selectedProject, selectedProjectHasOption: projectOptionChecker( selectedProject ) } },
                { provide: UiFacade, useValue: { notify: vi.fn() } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        } )
        facade = TestBed.inject( SelectedProjectFacade )
    } )

    it( 'fetches the participants status on demand', () => {
        // Arrange
        const expectedProjectId: string = 'p1'

        // Act
        facade.fetchParticipantsStatus()

        // Assert
        expect( findParticipantsStatus ).toHaveBeenCalledWith( expectedProjectId )
    } )

    it( 'fetches the vehicles status on demand', () => {
        // Arrange
        const expectedProjectId: string = 'p1'

        // Act
        facade.fetchVehiclesStatus()

        // Assert
        expect( findVehiclesStatus ).toHaveBeenCalledWith( expectedProjectId )
    } )

    it( 'fetches each current movements page with its own activity filter', () => {
        // Arrange
        const page: number = 1

        // Act
        facade.fetchCurrentMovementsPageWithActivity( page, 5 )
        facade.fetchCurrentMovementsPageWithoutActivity( page, 5 )

        // Assert
        expect( findMovements ).toHaveBeenNthCalledWith( 1, 'p1', 1, 5, expect.objectContaining( { hasActivity: true } ) )
        expect( findMovements ).toHaveBeenNthCalledWith( 2, 'p1', 1, 5, expect.objectContaining( { hasActivity: false } ) )
    } )

    it( 'fetches the current alerts page for the selected project', () => {
        // Arrange
        const size: number = 5

        // Act
        facade.fetchCurrentAlertsPage( 0, size )

        // Assert
        expect( findAlerts ).toHaveBeenCalledWith( 'p1', 0, 5, expect.anything() )
        expect( facade.currentAlertsPage() ).toBeDefined()
    } )

    it.each( [
        [ 'fetchParticipantsBirthdays', 'findParticipantsBirthdays' ],
        [ 'refreshParticipantsBirthdays', 'findParticipantsBirthdays' ],
        [ 'fetchPlannedArrivals', 'findPlannedArrivals' ],
        [ 'refreshPlannedArrivals', 'findPlannedArrivals' ],
        [ 'fetchPlannedDepartures', 'findPlannedDepartures' ],
        [ 'refreshPlannedDepartures', 'findPlannedDepartures' ],
        [ 'refreshParticipantsStatus', 'findParticipantsStatus' ],
        [ 'refreshVehiclesStatus', 'findVehiclesStatus' ],
    ] as const )( 'calls %s with the selected project', (method: keyof SelectedProjectFacade, api: string) => {
        // Arrange
        const spies: Record<string, Mock> = { findParticipantsBirthdays, findPlannedArrivals, findPlannedDepartures, findParticipantsStatus, findVehiclesStatus }

        // Act
        ;( facade[ method ] as () => void )()

        // Assert
        expect( spies[ api ] ).toHaveBeenCalledWith( 'p1' )
    } )

    it.each( [ 'fetchOverdueParticipantsPage', 'fetchOverdueParticipantsListPage' ] as const )( 'asks %s for the page of the selected project', (method: 'fetchOverdueParticipantsPage' | 'fetchOverdueParticipantsListPage') => {
        // Arrange
        const findParticipants: Mock = TestBed.inject( ParticipantApi ).findParticipants as Mock

        // Act
        facade[ method ]( 1, 5 )

        // Assert
        expect( findParticipants ).toHaveBeenCalledWith( 'p1', 1, 5, expect.anything() )
    } )

    it( 'refreshes every shown batch of the current alerts and overdue participants in one request', () => {
        // Arrange
        const findParticipants: Mock = TestBed.inject( ParticipantApi ).findParticipants as Mock
        facade.fetchCurrentAlertsPage( 0, 5 )
        facade.fetchOverdueParticipantsPage( 0, 5 )
        findAlerts.mockClear()
        findParticipants.mockClear()

        // Act
        facade.refreshCurrentAlertsPage()
        facade.refreshOverdueParticipantsPage()

        // Assert
        expect( findAlerts ).toHaveBeenCalledWith( 'p1', 0, expect.any( Number ), expect.anything() )
        expect( findParticipants ).toHaveBeenCalledWith( 'p1', 0, expect.any( Number ), expect.anything() )
    } )

    it( 'refreshes each current movements page with its own activity filter', () => {
        // Arrange
        facade.fetchCurrentMovementsPageWithActivity( 0, 5 )
        facade.fetchCurrentMovementsPageWithoutActivity( 0, 5 )
        findMovements.mockClear()

        // Act
        facade.refreshCurrentMovementsPageWithActivity()
        facade.refreshCurrentMovementsPageWithoutActivity()

        // Assert
        expect( findMovements ).toHaveBeenNthCalledWith( 1, 'p1', 0, expect.any( Number ), expect.objectContaining( { hasActivity: true } ) )
        expect( findMovements ).toHaveBeenNthCalledWith( 2, 'p1', 0, expect.any( Number ), expect.objectContaining( { hasActivity: false } ) )
    } )
} )

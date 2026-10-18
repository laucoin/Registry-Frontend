import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ProjectStatusModel } from '@shared/models/model/project-status.model'
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store'
import { pageOf, projectOptionChecker } from '@shared/helpers/testing/test-fixtures'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
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

    it( 'loads the participants status and birthdays of the selected project', () => {
        // Arrange
        const expectedProjectId: string = 'p1'

        // Act
        facade.loadProjectHomeInformation()

        // Assert
        expect( findParticipantsStatus ).toHaveBeenCalledWith( expectedProjectId )
        expect( findParticipantsBirthdays ).toHaveBeenCalledWith( expectedProjectId )
        expect( facade.participantsStatus()?.guests ).toBe( 1 )
    } )

    it( 'loads the participants to regularize of the selected project on demand', () => {
        // Arrange
        const size: number = 5

        // Act
        facade.fetchOverdueParticipantsPage( 0, size )

        // Assert
        expect( facade.overdueParticipantsPage()?.content ).toHaveLength( 1 )
        expect( facade.overdueParticipantsPageLoading() ).toBe( false )
        expect( facade.overdueParticipantsPageError() ).toBeUndefined()
    } )

    it( 'loads the planned arrivals and departures of the selected project on demand', () => {
        // Arrange
        const expectedProjectId: string = 'p1'

        // Act
        facade.fetchPlannedArrivals()
        facade.fetchPlannedDepartures()

        // Assert
        expect( findPlannedArrivals ).toHaveBeenCalledWith( expectedProjectId )
        expect( findPlannedDepartures ).toHaveBeenCalledWith( expectedProjectId )
        expect( facade.plannedArrivals() ).toEqual( [] )
        expect( facade.plannedDeparturesLoading() ).toBe( false )
        expect( facade.plannedArrivalsError() ).toBeUndefined()
    } )

    it( 'loads the birthdays of the selected project on demand', () => {
        // Arrange
        findParticipantsBirthdays.mockReturnValue( of( [ { id: 'pa1' } as ParticipantModel ] ) )

        // Act
        facade.fetchParticipantsBirthdays()

        // Assert
        expect( findParticipantsBirthdays ).toHaveBeenCalledWith( 'p1' )
        expect( facade.participantsBirthdays() ).toHaveLength( 1 )
        expect( facade.participantsBirthdaysLoading() ).toBe( false )
    } )

    it( 'skips the vehicles status when the project does not have the vehicle option', () => {
        // Arrange
        selectedProject.set( { id: 'p1', options: [ { label: 'Alerts', value: ProjectOptionEnum.ALERT } ] } as unknown as ProjectModel )

        // Act
        facade.loadProjectHomeInformation()

        // Assert
        expect( findVehiclesStatus ).not.toHaveBeenCalled()
    } )

    it( 'loads the vehicles status when the project has the vehicle option', () => {
        // Arrange
        selectedProject.set( { id: 'p1', options: [ { label: 'Vehicles', value: ProjectOptionEnum.VEHICLE } ] } as unknown as ProjectModel )

        // Act
        facade.loadProjectHomeInformation()

        // Assert
        expect( findVehiclesStatus ).toHaveBeenCalledWith( 'p1' )
        expect( facade.vehiclesStatus() ).toBeDefined()
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

    it( 'reloads every shown batch of each current movements list in one request', () => {
        // Arrange
        facade.fetchCurrentMovementsPageWithActivity( 1, 5 )
        facade.fetchCurrentMovementsPageWithoutActivity( 1, 5 )
        findMovements.mockClear()

        // Act
        facade.reloadCurrentMovementsPageWithActivity()
        facade.reloadCurrentMovementsPageWithoutActivity()

        // Assert
        expect( findMovements ).toHaveBeenNthCalledWith( 1, 'p1', 0, expect.any( Number ), expect.objectContaining( { hasActivity: true } ) )
        expect( findMovements ).toHaveBeenNthCalledWith( 2, 'p1', 0, expect.any( Number ), expect.objectContaining( { hasActivity: false } ) )
    } )
} )

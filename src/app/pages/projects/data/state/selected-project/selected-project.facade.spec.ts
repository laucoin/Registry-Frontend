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
import { ProjectStatusModel } from '@pages/projects/data/model/project-status.model'
import { VehicleStatusModel } from '@pages/projects/data/model/vehicle-status.model'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store'
import { pageOf } from '@shared/helpers/testing/test-fixtures'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { AlertModel } from '@shared/models/model/alert.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ProjectModel } from '@shared/models/model/project.model'

describe( 'SelectedProjectFacade', () => {
    let facade: SelectedProjectFacade
    let findMovements: Mock<MovementApi['findMovements']>
    let findParticipantsStatus: Mock<MovementApi['findParticipantsStatus']>
    let findVehiclesStatus: Mock<MovementApi['findVehiclesStatus']>
    let findParticipantsBirthdays: Mock<ParticipantApi['findParticipantsBirthdays']>
    let findAlerts: Mock<AlertApi['findAlerts']>
    let selectedProject: WritableSignal<ProjectModel | undefined>

    beforeEach( () => {
        findMovements = vi.fn( () => of( pageOf<MovementModel>( [] ) ) )
        findParticipantsStatus = vi.fn( () => of( { guests: 1 } as unknown as ProjectStatusModel ) )
        findVehiclesStatus = vi.fn( () => of( { total: 1 } as unknown as VehicleStatusModel ) )
        findParticipantsBirthdays = vi.fn( () => of( [] ) )
        findAlerts = vi.fn( () => of( pageOf<AlertModel>( [] ) ) )
        selectedProject = signal<ProjectModel | undefined>( { id: 'p1', options: [] } as unknown as ProjectModel )
        TestBed.configureTestingModule( {
            providers: [
                SelectedProjectFacade,
                SelectedProjectStore,
                { provide: MovementApi, useValue: { findMovements, findParticipantsStatus, findVehiclesStatus, findMovementsContents: vi.fn( () => of( [] ) ) } },
                { provide: AlertApi, useValue: { findAlerts } },
                { provide: ParticipantApi, useValue: { findParticipantsBirthdays } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ), selectedProject } },
                { provide: UiFacade, useValue: { notify: vi.fn(), setGlobalError: vi.fn() } },
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
        const pageNumber: number = 1

        // Act
        facade.fetchCurrentMovementsPageWithActivity( pageNumber, 5 )
        facade.fetchCurrentMovementsPageWithoutActivity( pageNumber, 5 )

        // Assert
        expect( findMovements ).toHaveBeenNthCalledWith( 1, 'p1', 1, 5, expect.objectContaining( { linkedToActivity: true } ) )
        expect( findMovements ).toHaveBeenNthCalledWith( 2, 'p1', 1, 5, expect.objectContaining( { linkedToActivity: false } ) )
    } )

    it( 'fetches the current alerts page for the selected project', () => {
        // Arrange
        const pageSize: number = 5

        // Act
        facade.fetchCurrentAlertsPage( 0, pageSize )

        // Assert
        expect( findAlerts ).toHaveBeenCalledWith( 'p1', 0, 5, expect.anything() )
        expect( facade.currentAlertsPage() ).toBeDefined()
    } )
} )

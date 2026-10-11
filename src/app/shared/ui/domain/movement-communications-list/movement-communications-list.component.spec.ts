import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { Subject } from 'rxjs'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { MovementCommunicationsListComponent } from '@shared/ui/domain/movement-communications-list/movement-communications-list.component'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { MovementModel } from '@shared/models/model/movement.model'

describe('MovementCommunicationsListComponent', () => {
    let facade: Record<string, Mock>
    let firstPageReload: Subject<unknown>
    let currentPageReload: Subject<unknown>
    let component: MovementCommunicationsListComponent

    beforeEach(() => {
        firstPageReload = new Subject<unknown>()
        currentPageReload = new Subject<unknown>()
        facade = { fetchMovementCommunicationsPage: vi.fn(), movementCommunicationsPage: vi.fn(() => ({ pageNumber: 2, pageSize: 10, content: [] })) }
        TestBed.configureTestingModule({
            providers: [
                { provide: UiFacade, useValue: {} },
                { provide: SessionFacade, useValue: {} },
                { provide: ActivatedRoute, useValue: {} },
                { provide: Router, useValue: {} },
                { provide: TranslocoService, useValue: {} },
                { provide: MovementFacade, useValue: facade },
                { provide: CommunicationFacade, useValue: { handleCommunicationFirstPageReload: (): unknown => firstPageReload, handleCommunicationCurrentPageReload: (): unknown => currentPageReload } },
                { provide: AlertFacade, useValue: { handleAlertCreation: (): unknown => new Subject<unknown>() } },
            ],
        })
        TestBed.overrideComponent(MovementCommunicationsListComponent, { set: { template: '', imports: [], providers: [] } })
        const fixture: ComponentFixture<MovementCommunicationsListComponent> = TestBed.createComponent(MovementCommunicationsListComponent)
        fixture.componentRef.setInput('movement', { id: 'x1' } as unknown as MovementModel)
        component = fixture.componentInstance
        component.ngOnInit()
        facade['fetchMovementCommunicationsPage'].mockClear()
    })

    it('reloads the first batch when a communication is created or removed', () => {
        // Arrange
        const expectedId: string = 'x1'

        // Act
        firstPageReload.next(undefined)

        // Assert
        expect(facade['fetchMovementCommunicationsPage']).toHaveBeenCalledWith(expectedId, undefined, undefined)
    })

    it('reloads the page already shown when a communication changes', () => {
        // Arrange
        const expectedId: string = 'x1'

        // Act
        currentPageReload.next(undefined)

        // Assert
        expect(facade['fetchMovementCommunicationsPage']).toHaveBeenCalledWith(expectedId, 2, 10)
    })

    it('stops reloading once the list is destroyed', () => {
        // Arrange
        component.ngOnDestroy()

        // Act
        firstPageReload.next(undefined)

        // Assert
        expect(facade['fetchMovementCommunicationsPage']).not.toHaveBeenCalled()
    })
})

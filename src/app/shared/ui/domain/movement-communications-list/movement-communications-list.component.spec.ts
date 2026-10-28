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
        facade = { fetchMovementCommunicationsPage: vi.fn(), reloadMovementCommunications: vi.fn(), loadOlderMovementCommunications: vi.fn(), movementCommunicationsPageLoading: vi.fn(() => false), movementCommunicationsPageSilentLoading: vi.fn(() => false), movementCommunicationsPage: vi.fn(() => ({ page: 2, size: 10, content: [ { lastEdition: { user: { id: 'u1', firstName: 'Ada' } } }, { lastEdition: { user: { id: 'u2', firstName: 'Bo' } } } ] })) }
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
        expect(facade['reloadMovementCommunications']).toHaveBeenCalledWith(expectedId)
    })

    it('reloads the page already shown when a communication changes', () => {
        // Arrange
        const expectedId: string = 'x1'

        // Act
        currentPageReload.next(undefined)

        // Assert
        expect(facade['reloadMovementCommunications']).toHaveBeenCalledWith(expectedId)
    })

    it('loads the older communications when the top of the conversation is reached', () => {
        // Arrange
        const list: { loadOlder: () => void } = component as never

        // Act
        list.loadOlder()

        // Assert
        expect(facade['loadOlderMovementCommunications']).toHaveBeenCalledWith('x1')
    })

    it('waits for the running load before asking for older communications', () => {
        // Arrange
        facade['movementCommunicationsPageLoading'].mockReturnValue(true)
        const list: { loadOlder: () => void } = component as never

        // Act
        list.loadOlder()

        // Assert
        expect(facade['loadOlderMovementCommunications']).not.toHaveBeenCalled()
    })

    it('stops reloading once the list is destroyed', () => {
        // Arrange
        TestBed.resetTestingModule()

        // Act
        firstPageReload.next(undefined)

        // Assert
        expect(facade['reloadMovementCommunications']).not.toHaveBeenCalled()
    })

    it('gives the author of the previous and of the next message to group a conversation', () => {
        // Arrange
        const list: { getPreviousAuthorId: (index: number) => string | undefined, getNextAuthorId: (index: number) => string | undefined } = component as never

        // Act
        const previous: string | undefined = list.getPreviousAuthorId(1)
        const next: string | undefined = list.getNextAuthorId(0)

        // Assert
        expect(previous).toBe('u2')
        expect(next).toBe('u1')
    })

    it('loads the first batch of communications when it opens', () => {
        // Arrange
        facade['fetchMovementCommunicationsPage'].mockClear()

        // Act
        component.ngOnInit()

        // Assert
        expect(facade['fetchMovementCommunicationsPage']).toHaveBeenCalledWith('x1', undefined, undefined)
    })
})

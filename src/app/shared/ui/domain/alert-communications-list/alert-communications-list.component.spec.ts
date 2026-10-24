import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertModel } from '@shared/models/model/alert.model'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { AlertCommunicationsListComponent } from '@shared/ui/domain/alert-communications-list/alert-communications-list.component'

describe('AlertCommunicationsListComponent', () => {
    let facade: Record<string, Mock>
    let firstPageReload: Subject<unknown>
    let currentPageReload: Subject<unknown>
    let component: AlertCommunicationsListComponent

    beforeEach(() => {
        firstPageReload = new Subject<unknown>()
        currentPageReload = new Subject<unknown>()
        facade = { fetchAlertCommunicationsPage: vi.fn(), reloadAlertCommunications: vi.fn(), loadOlderAlertCommunications: vi.fn(), alertCommunicationsPageLoading: vi.fn(() => false), alertCommunicationsPageSilentLoading: vi.fn(() => false), alertCommunicationsPage: vi.fn(() => ({ page: 2, size: 10, content: [ { lastEdition: { user: { id: 'u1', firstName: 'Ada' } } }, { lastEdition: { user: { id: 'u2', firstName: 'Bo' } } } ] })) }
        TestBed.configureTestingModule({
            providers: [
                { provide: AlertFacade, useValue: facade },
                { provide: CommunicationFacade, useValue: { handleCommunicationFirstPageReload: (): unknown => firstPageReload, handleCommunicationCurrentPageReload: (): unknown => currentPageReload } },
            ],
        })
        TestBed.overrideComponent(AlertCommunicationsListComponent, { set: { template: '', imports: [], providers: [] } })
        const fixture: ComponentFixture<AlertCommunicationsListComponent> = TestBed.createComponent(AlertCommunicationsListComponent)
        fixture.componentRef.setInput('alert', { id: 'x1' } as unknown as AlertModel)
        component = fixture.componentInstance
        component.ngOnInit()
        facade['fetchAlertCommunicationsPage'].mockClear()
    })

    it('reloads the first batch when a communication is created or removed', () => {
        // Arrange
        const expectedId: string = 'x1'

        // Act
        firstPageReload.next(undefined)

        // Assert
        expect(facade['reloadAlertCommunications']).toHaveBeenCalledWith(expectedId)
    })

    it('reloads the page already shown when a communication changes', () => {
        // Arrange
        const expectedId: string = 'x1'

        // Act
        currentPageReload.next(undefined)

        // Assert
        expect(facade['reloadAlertCommunications']).toHaveBeenCalledWith(expectedId)
    })

    it('loads the older communications when the top of the conversation is reached', () => {
        // Arrange
        const list: { loadOlder: () => void } = component as never

        // Act
        list.loadOlder()

        // Assert
        expect(facade['loadOlderAlertCommunications']).toHaveBeenCalledWith('x1')
    })

    it('waits for the running load before asking for older communications', () => {
        // Arrange
        facade['alertCommunicationsPageLoading'].mockReturnValue(true)
        const list: { loadOlder: () => void } = component as never

        // Act
        list.loadOlder()

        // Assert
        expect(facade['loadOlderAlertCommunications']).not.toHaveBeenCalled()
    })

    it('stops reloading once the list is destroyed', () => {
        // Arrange
        TestBed.resetTestingModule()

        // Act
        firstPageReload.next(undefined)

        // Assert
        expect(facade['reloadAlertCommunications']).not.toHaveBeenCalled()
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
        facade['fetchAlertCommunicationsPage'].mockClear()

        // Act
        component.ngOnInit()

        // Assert
        expect(facade['fetchAlertCommunicationsPage']).toHaveBeenCalledWith('x1', undefined, undefined)
    })
})

import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { CommunicationActions } from '@shared/ui/domain/dialog-element/communication-actions.service'

const VISIBLE: CommunicationModel = { id: 'x1', visible: true } as unknown as CommunicationModel
const HIDDEN: CommunicationModel = { ...VISIBLE, visible: false }

describe('CommunicationActions', () => {
    let actions: CommunicationActions
    let authorities: WritableSignal<string[]>
    let facade: Record<string, Mock>
    let confirm: Mock<(prefix: string, element: unknown, severity: unknown, icon: string, accept: () => void) => void>

    const find = (element: CommunicationModel, id: string): ElementActionModel =>
        actions.actionsFor(element).find((action: ElementActionModel): boolean => action.id === id)!

    beforeEach(() => {
        RegistryConfig.config = { enabledActions: Object.values(ElementActionEnum) } as never
        authorities = signal(['p1_REGISTRY_PROJECT_COMMUNICATION_U', 'p1_REGISTRY_PROJECT_COMMUNICATION_D'])
        facade = { disableCommunication: vi.fn(() => of(undefined)), enableCommunication: vi.fn(() => of(undefined)), deleteCommunication: vi.fn(() => of(undefined)), fetchCommunication: vi.fn() }
        confirm = vi.fn()
        TestBed.configureTestingModule({
            providers: [
                CommunicationActions,
                { provide: CommunicationFacade, useValue: facade },
                { provide: ElementConfirmationService, useValue: { confirm } },
                { provide: SessionFacade, useValue: { currentUser: (): unknown => ({ authorities: authorities() }), selectedProject: (): unknown => ({ id: 'p1' }), currentProjectId: (): string => 'p1' } },
            ],
        })
        actions = TestBed.inject(CommunicationActions)
    })

    it('offers the edit, hide and delete commands for a visible element', () => {
        // Arrange
        const element: CommunicationModel = VISIBLE

        // Act
        const ids: string[] = actions.actionsFor(element).map((action: ElementActionModel): string => action.id)

        // Assert
        expect(ids).toEqual(['edit', 'disable', 'delete'])
    })

    it('offers the show command instead of hide for a hidden element', () => {
        // Arrange
        const element: CommunicationModel = HIDDEN

        // Act
        const ids: string[] = actions.actionsFor(element).map((action: ElementActionModel): string => action.id)

        // Assert
        expect(ids).toEqual(['edit', 'enable', 'delete'])
    })

    it.each([
        ['disable', 'disableCommunication', VISIBLE],
        ['enable', 'enableCommunication', HIDDEN],
    ])('asks for a confirmation before running %s, then calls the facade with the identifier', (id: string, call: string, element: CommunicationModel) => {
        // Arrange
        const action: ElementActionModel = find(element, id)

        // Act
        action.run()
        confirm.mock.calls[0][4]()

        // Assert
        expect(facade[call]).toHaveBeenCalledWith('x1')
    })

    it('asks for a confirmation before deleting, then deletes the element', () => {
        // Arrange
        const action: ElementActionModel = find(VISIBLE, 'delete')

        // Act
        action.run()
        confirm.mock.calls[0][4]()

        // Assert
        expect(facade['deleteCommunication']).toHaveBeenCalledWith(VISIBLE)
    })

    it('disables the commands the user has no authority for', () => {
        // Arrange
        authorities.set(['p1_REGISTRY_PROJECT_COMMUNICATION_U'])

        // Act
        const [edit, hide, remove]: ElementActionModel[] = actions.actionsFor(VISIBLE)

        // Assert
        expect(edit.disabled).toBe(false)
        expect(hide.disabled).toBe(false)
        expect(remove.disabled).toBe(true)
    })

    it('offers no command when the configuration enables none', () => {
        // Arrange
        RegistryConfig.config = { enabledActions: [] } as never

        // Act
        const shown: ElementActionModel[] = actions.actionsFor(VISIBLE)

        // Assert
        expect(shown).toEqual([])
    })

    it('loads the communication in the form when the user edits it', () => {
        // Arrange
        const edit: ElementActionModel = find(VISIBLE, 'edit')

        // Act
        edit.run()

        // Assert
        expect(facade['fetchCommunication']).toHaveBeenCalledWith('x1')
    })
})

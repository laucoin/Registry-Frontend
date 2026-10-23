import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementActions } from '@shared/ui/domain/movement-element/movement-actions.service'

const VISIBLE: MovementModel = { id: 'x1', visible: true } as unknown as MovementModel
const HIDDEN: MovementModel = { ...VISIBLE, visible: false }

describe('MovementActions', () => {
    let actions: MovementActions
    let authorities: WritableSignal<string[]>
    let facade: Record<string, Mock>
    let confirm: Mock<(prefix: string, element: unknown, severity: unknown, icon: string, accept: () => void) => void>
    let navigateByUrl: Mock

    const find = (element: MovementModel, id: string): ElementActionModel =>
        actions.actionsFor(element).find((action: ElementActionModel): boolean => action.id === id)!

    beforeEach(() => {
        RegistryConfig.config = { enabledActions: Object.values(ElementActionEnum) } as never
        authorities = signal(['p1_REGISTRY_PROJECT_MOVEMENT_U', 'p1_REGISTRY_PROJECT_MOVEMENT_D'])
        facade = { disableMovement: vi.fn(() => of(undefined)), enableMovement: vi.fn(() => of(undefined)), deleteMovement: vi.fn(() => of(undefined)) }
        confirm = vi.fn()
        navigateByUrl = vi.fn(() => Promise.resolve(true))
        TestBed.configureTestingModule({
            providers: [
                MovementActions,
                { provide: MovementFacade, useValue: facade },
                { provide: ElementConfirmationService, useValue: { confirm } },
                { provide: Router, useValue: { navigateByUrl } },
                { provide: SessionFacade, useValue: { currentUser: (): unknown => ({ authorities: authorities() }), selectedProject: (): unknown => ({ id: 'p1' }), currentProjectId: (): string => 'p1' } },
            ],
        })
        actions = TestBed.inject(MovementActions)
    })

    it('offers the edit, hide and delete commands for a visible element', () => {
        // Arrange
        const element: MovementModel = VISIBLE

        // Act
        const ids: string[] = actions.actionsFor(element).map((action: ElementActionModel): string => action.id)

        // Assert
        expect(ids).toEqual(['edit', 'disable', 'delete'])
    })

    it('offers the show command instead of hide for a hidden element', () => {
        // Arrange
        const element: MovementModel = HIDDEN

        // Act
        const ids: string[] = actions.actionsFor(element).map((action: ElementActionModel): string => action.id)

        // Assert
        expect(ids).toEqual(['edit', 'enable', 'delete'])
    })

    it.each([
        ['disable', 'disableMovement', VISIBLE],
        ['enable', 'enableMovement', HIDDEN],
    ])('asks for a confirmation before running %s, then calls the facade with the identifier', (id: string, call: string, element: MovementModel) => {
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
        expect(facade['deleteMovement']).toHaveBeenCalledWith(VISIBLE)
    })

    it('disables the commands the user has no authority for', () => {
        // Arrange
        authorities.set(['p1_REGISTRY_PROJECT_MOVEMENT_U'])

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

    it('opens the edition route of the movement in the selected project', () => {
        // Arrange
        const edit: ElementActionModel = find(VISIBLE, 'edit')

        // Act
        edit.run()

        // Assert
        expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('x1'))
        expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('p1'))
    })

    it.each([
        ['REGISTERED', '/edit/registered'],
        ['GUEST', '/edit/guest'],
    ])('opens the %s edition page of the movement', (contentType: string, suffix: string) => {
        // Arrange
        const edit: ElementActionModel = find({ ...VISIBLE, contentType } as unknown as MovementModel, 'edit')

        // Act
        edit.run()

        // Assert
        expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining(suffix))
    })
})

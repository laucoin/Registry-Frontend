import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ElementActionsBase, ElementActionSpec } from '@shared/helpers/facade/element-actions.base'
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ElementActionModel } from '@shared/models/model/element-action.model'

class FakeActions extends ElementActionsBase<{ id: string }> {
    public command: () => void = vi.fn()
    protected readonly translationPrefix: string = 'fake'
    protected override readonly primaryActionId: string = 'open'

    protected specsFor(): ElementActionSpec[] {
        return [
            { id: 'open', icon: 'folder', enabledAction: ElementActionEnum.GROUP_CONSULT_MEMBERS, shown: true, allowed: false, run: this.command },
            { id: 'remove', icon: 'trash', enabledAction: ElementActionEnum.GROUP_DELETE, shown: true, allowed: true, confirmation: { severity: SeverityEnum.DANGER, icon: 'x', accept: this.command } },
            { id: 'hidden', icon: 'eye', enabledAction: ElementActionEnum.GROUP_UPDATE, shown: false, allowed: true, run: this.command },
        ]
    }
}

describe('ElementActionsBase', () => {
    let actions: FakeActions
    let confirm: ReturnType<typeof vi.fn>

    beforeEach(() => {
        RegistryConfig.config = { enabledActions: [ElementActionEnum.GROUP_CONSULT_MEMBERS, ElementActionEnum.GROUP_DELETE] } as never
        confirm = vi.fn()
        TestBed.configureTestingModule({ providers: [FakeActions, { provide: ElementConfirmationService, useValue: { confirm } }, { provide: SessionFacade, useValue: {} }] })
        actions = TestBed.inject(FakeActions)
    })

    it('keeps the shown and enabled actions only', () => {
        // Arrange
        const element: { id: string } = { id: 'e1' }

        // Act
        const ids: string[] = actions.actionsFor(element).map((action: ElementActionModel): string => action.id)

        // Assert
        expect(ids).toEqual(['open', 'remove'])
    })

    it('flags the unauthorised action as disabled and the dangerous one as danger', () => {
        // Arrange
        const element: { id: string } = { id: 'e1' }

        // Act
        const [open, remove]: ElementActionModel[] = actions.actionsFor(element)

        // Assert
        expect(open.disabled).toBe(true)
        expect(remove.danger).toBe(true)
    })

    it('puts the confirmation in front of the command that needs one', () => {
        // Arrange
        const element: { id: string } = { id: 'e1' }
        const remove: ElementActionModel = actions.actionsFor(element)[1]

        // Act
        remove.run()

        // Assert
        expect(confirm).toHaveBeenCalledWith('fake.actions.confirmations.remove', element, SeverityEnum.DANGER, 'x', actions.command)
        expect(actions.command).not.toHaveBeenCalled()
    })

    it('splits the primary action from the menu', () => {
        // Arrange
        const element: { id: string } = { id: 'e1' }

        // Act
        const primary: ElementActionModel | undefined = actions.primaryFor(element)
        const menu: string[] = actions.menuFor(element).map((action: ElementActionModel): string => action.id)

        // Assert
        expect(primary?.id).toBe('open')
        expect(menu).toEqual(['remove'])
    })

    it('has no primary action when the configuration disables it', () => {
        // Arrange
        RegistryConfig.config = { enabledActions: [ElementActionEnum.GROUP_DELETE] } as never

        // Act
        const primary: ElementActionModel | undefined = actions.primaryFor({ id: 'e1' })

        // Assert
        expect(primary).toBeUndefined()
    })

    it('uses the translation key of the action for its confirmation when it has one', () => {
        // Arrange
        class KeyedActions extends FakeActions {
            protected override specsFor(): ElementActionSpec[] {
                return [{ id: 'remove', icon: 'trash', enabledAction: ElementActionEnum.GROUP_DELETE, shown: true, allowed: true, confirmation: { severity: SeverityEnum.INFO, icon: 'x', accept: this.command, translationKey: 'status.DONE' } }]
            }
        }
        const keyed: KeyedActions = TestBed.runInInjectionContext((): KeyedActions => new KeyedActions())

        // Act
        keyed.actionsFor({ id: 'e1' })[0].run()

        // Assert
        expect(confirm.mock.calls[0][0]).toBe('fake.actions.confirmations.status.DONE')
    })
})

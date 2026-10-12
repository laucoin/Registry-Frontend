import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { UserActions } from '@pages/users/users-list/user-actions.service'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { UserModel } from '@shared/models/model/user.model'

const ACTIVE: UserModel = { id: 'u2', visible: true, firstName: 'Ada', lastName: 'Lovelace' } as UserModel
const BLOCKED: UserModel = { ...ACTIVE, visible: false }

describe('UserActions', () => {
    let actions: UserActions
    let authorities: WritableSignal<string[]>
    let currentUserId: WritableSignal<string>
    let facade: Record<string, Mock>
    let confirm: Mock<(confirmation: { accept: () => void, acceptSeverity: SeverityEnum }) => void>
    let navigateByUrl: Mock<(url: string) => Promise<boolean>>

    beforeEach(() => {
        RegistryConfig.config = { enabledActions: Object.values(ElementActionEnum) } as never
        authorities = signal(['REGISTRY_USER_U', 'REGISTRY_USER_D'])
        currentUserId = signal('u1')
        facade = { bockUser: vi.fn(), unblockUser: vi.fn(), impersonateUser: vi.fn(), deleteUser: vi.fn() }
        confirm = vi.fn()
        navigateByUrl = vi.fn(() => Promise.resolve(true))
        TestBed.configureTestingModule({
            providers: [
                UserActions,
                { provide: UserFacade, useValue: facade },
                { provide: SessionFacade, useValue: { currentUser: (): unknown => ({ id: currentUserId(), authorities: authorities() }) } },
                { provide: UiFacade, useValue: { confirm } },
                { provide: Router, useValue: { navigateByUrl } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        })
        actions = TestBed.inject(UserActions)
    })

    function find(user: UserModel, id: string): ElementActionModel | undefined {
        return actions.actionsFor(user).find((action: ElementActionModel): boolean => action.id === id)
    }

    it('offers every command but unblock for an active user', () => {
        // Arrange
        const user: UserModel = ACTIVE

        // Act
        const ids: string[] = actions.actionsFor(user).map((action: ElementActionModel): string => action.id)

        // Assert
        expect(ids).toEqual(['update-role', 'disable', 'impersonate', 'delete'])
    })

    it('offers unblock instead of block for a blocked user', () => {
        // Arrange
        const user: UserModel = BLOCKED

        // Act
        const ids: string[] = actions.actionsFor(user).map((action: ElementActionModel): string => action.id)

        // Assert
        expect(ids).toEqual(['update-role', 'enable', 'impersonate', 'delete'])
    })

    it('offers nothing on the account of the signed-in user', () => {
        // Arrange
        currentUserId.set('u2')

        // Act
        const shown: ElementActionModel[] = actions.actionsFor(ACTIVE)

        // Assert
        expect(shown).toEqual([])
    })

    it('leaves out the actions that are not enabled in the configuration', () => {
        // Arrange
        RegistryConfig.config = { enabledActions: [ElementActionEnum.USER_BLOCK] } as never

        // Act
        const ids: string[] = actions.actionsFor(ACTIVE).map((action: ElementActionModel): string => action.id)

        // Assert
        expect(ids).toEqual(['disable'])
    })

    it('disables the commands the signed-in user has no authority for', () => {
        // Arrange
        authorities.set(['REGISTRY_USER_U'])

        // Act
        const flags: boolean[] = ['update-role', 'disable', 'impersonate', 'delete'].map((id: string): boolean => find(ACTIVE, id)!.disabled)

        // Assert
        expect(flags).toEqual([false, false, true, true])
    })

    it('opens the role edition route of the user', () => {
        // Arrange
        const updateRole: ElementActionModel = find(ACTIVE, 'update-role')!

        // Act
        updateRole.run()

        // Assert
        expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('u2'))
    })

    it.each([
        ['disable', 'bockUser', SeverityEnum.WARNING, ACTIVE, 'u2'],
        ['enable', 'unblockUser', SeverityEnum.INFO, BLOCKED, 'u2'],
        ['impersonate', 'impersonateUser', SeverityEnum.DANGER, ACTIVE, ACTIVE],
        ['delete', 'deleteUser', SeverityEnum.DANGER, ACTIVE, ACTIVE],
    ])('asks for a confirmation before running %s, then calls the facade', (id: string, call: string, severity: SeverityEnum, user: UserModel, argument: unknown) => {
        // Arrange
        const action: ElementActionModel = find(user, id)!

        // Act
        action.run()
        const beforeAccept: number = facade[call].mock.calls.length
        confirm.mock.calls[0][0].accept()

        // Assert
        expect(beforeAccept).toBe(0)
        expect(confirm.mock.calls[0][0].acceptSeverity).toBe(severity)
        expect(facade[call]).toHaveBeenCalledWith(argument)
        expect(action.danger).toBe(severity === SeverityEnum.DANGER)
    })
})

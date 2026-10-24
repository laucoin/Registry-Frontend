import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertModel } from '@shared/models/model/alert.model'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { AlertActions } from '@shared/ui/domain/alert-element/alert-actions.service'

const alertOf = (status: AlertStatusEnum, visible: boolean = true): AlertModel => ({ id: 'a1', visible, status: { value: status } }) as unknown as AlertModel

describe('AlertActions', () => {
    let actions: AlertActions
    let confirm: Mock<(prefix: string, element: unknown, severity: unknown, icon: string, accept: () => void) => void>
    let updateAlertStatus: Mock
    let disableAlert: Mock
    let enableAlert: Mock
    let deleteAlert: Mock
    let authorities: WritableSignal<string[]>

    const ids = (alert: AlertModel): string[] => actions.actionsFor(alert).map((action: ElementActionModel): string => action.id)

    beforeEach(() => {
        confirm = vi.fn()
        updateAlertStatus = vi.fn(() => of(undefined))
        disableAlert = vi.fn(() => of(undefined))
        enableAlert = vi.fn(() => of(undefined))
        deleteAlert = vi.fn(() => of(undefined))
        authorities = signal(['p1_REGISTRY_PROJECT_ALERT_U', 'p1_REGISTRY_PROJECT_ALERT_D'])
        TestBed.configureTestingModule({
            providers: [
                AlertActions,
                { provide: AlertFacade, useValue: { updateAlertStatus, disableAlert, enableAlert, deleteAlert } },
                { provide: ElementConfirmationService, useValue: { confirm } },
                { provide: SessionFacade, useValue: { currentUser: (): unknown => ({ authorities: authorities() }), selectedProject: signal({ id: 'p1' }) } },
            ],
        })
        actions = TestBed.inject(AlertActions)
    })

    it('offers to resolve or cancel an alert in progress', () => {
        // Arrange
        const alert: AlertModel = alertOf(AlertStatusEnum.IN_PROGRESS)

        // Act
        const shown: string[] = ids(alert)

        // Assert
        expect(shown).toEqual(['resolve', 'cancel', 'disable', 'delete'])
    })

    it('offers to reopen a closed alert', () => {
        // Arrange
        const alert: AlertModel = alertOf(AlertStatusEnum.RESOLVED)

        // Act
        const shown: string[] = ids(alert)

        // Assert
        expect(shown).toEqual(['reopen', 'disable', 'delete'])
    })

    it('confirms with the translation of the target status, then updates the status', () => {
        // Arrange
        const resolve: ElementActionModel = actions.actionsFor(alertOf(AlertStatusEnum.IN_PROGRESS))[0]

        // Act
        resolve.run()
        confirm.mock.calls[0][4]()

        // Assert
        expect(confirm.mock.calls[0][0]).toBe('alerts.actions.confirmations.status.RESOLVED')
        expect(updateAlertStatus).toHaveBeenCalledWith('a1', AlertStatusEnum.RESOLVED)
    })

    it('offers only the show and delete commands for a hidden alert', () => {
        // Arrange
        const alert: AlertModel = alertOf(AlertStatusEnum.IN_PROGRESS, false)

        // Act
        const shown: string[] = ids(alert)

        // Assert
        expect(shown).toEqual(['enable', 'delete'])
    })

    it.each([
        [AlertStatusEnum.IN_PROGRESS, 'cancel', AlertStatusEnum.CANCELED],
        [AlertStatusEnum.CANCELED, 'reopen', AlertStatusEnum.IN_PROGRESS],
    ])('confirms then moves an alert from %s with %s to %s', (from: AlertStatusEnum, id: string, target: AlertStatusEnum) => {
        // Arrange
        const action: ElementActionModel = actions.actionsFor(alertOf(from)).find((it: ElementActionModel): boolean => it.id === id)!

        // Act
        action.run()
        confirm.mock.calls[0][4]()

        // Assert
        expect(confirm.mock.calls[0][0]).toBe(`alerts.actions.confirmations.status.${target}`)
        expect(updateAlertStatus).toHaveBeenCalledWith('a1', target)
    })

    it.each([
        ['disable', true, (): Mock => disableAlert],
        ['enable', false, (): Mock => enableAlert],
        ['delete', true, (): Mock => deleteAlert],
    ])('asks for a confirmation before %s, then calls the facade', (id: string, visible: boolean, call: () => Mock) => {
        // Arrange
        const action: ElementActionModel = actions.actionsFor(alertOf(AlertStatusEnum.IN_PROGRESS, visible)).find((it: ElementActionModel): boolean => it.id === id)!

        // Act
        action.run()
        confirm.mock.calls[0][4]()

        // Assert
        expect(call()).toHaveBeenCalledTimes(1)
    })

    it('disables the commands the user has no authority for', () => {
        // Arrange
        authorities.set(['p1_REGISTRY_PROJECT_ALERT_U'])

        // Act
        const remove: ElementActionModel = actions.actionsFor(alertOf(AlertStatusEnum.IN_PROGRESS)).find((it: ElementActionModel): boolean => it.id === 'delete')!

        // Assert
        expect(remove.disabled).toBe(true)
    })

})

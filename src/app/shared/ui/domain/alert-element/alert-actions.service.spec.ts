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
    let confirm: Mock<(prefix: string, element: unknown, severity: unknown, accept: () => void) => void>
    let updateAlertStatus: Mock
    let softDeleteAlert: Mock
    let restoreAlert: Mock
    let hardDeleteAlert: Mock
    let authorities: WritableSignal<string[]>

    const ids = (alert: AlertModel): string[] => actions.actionsFor(alert).map((action: ElementActionModel): string => action.id)

    beforeEach(() => {
        confirm = vi.fn()
        updateAlertStatus = vi.fn(() => of(undefined))
        softDeleteAlert = vi.fn(() => of(undefined))
        restoreAlert = vi.fn(() => of(undefined))
        hardDeleteAlert = vi.fn(() => of(undefined))
        authorities = signal(['p1_REGISTRY_PROJECT_ALERT_U', 'p1_REGISTRY_PROJECT_ALERT_SOFT_DELETE', 'p1_REGISTRY_PROJECT_ALERT_RESTORE', 'p1_REGISTRY_PROJECT_ALERT_D'])
        TestBed.configureTestingModule({
            providers: [
                AlertActions,
                { provide: AlertFacade, useValue: { updateAlertStatus, softDeleteAlert, restoreAlert, hardDeleteAlert } },
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
        expect(shown).toEqual(['resolve', 'cancel', 'softDelete', 'hardDelete'])
    })

    it('offers to reopen a closed alert', () => {
        // Arrange
        const alert: AlertModel = alertOf(AlertStatusEnum.RESOLVED)

        // Act
        const shown: string[] = ids(alert)

        // Assert
        expect(shown).toEqual(['reopen', 'softDelete', 'hardDelete'])
    })

    it('confirms with the translation of the target status, then updates the status', () => {
        // Arrange
        const resolve: ElementActionModel = actions.actionsFor(alertOf(AlertStatusEnum.IN_PROGRESS))[0]

        // Act
        resolve.run()
        confirm.mock.calls[0][3]()

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
        expect(shown).toEqual(['restore', 'hardDelete'])
    })

    it.each([
        [AlertStatusEnum.IN_PROGRESS, 'cancel', AlertStatusEnum.CANCELED],
        [AlertStatusEnum.CANCELED, 'reopen', AlertStatusEnum.IN_PROGRESS],
    ])('confirms then moves an alert from %s with %s to %s', (from: AlertStatusEnum, id: string, target: AlertStatusEnum) => {
        // Arrange
        const action: ElementActionModel = actions.actionsFor(alertOf(from)).find((it: ElementActionModel): boolean => it.id === id)!

        // Act
        action.run()
        confirm.mock.calls[0][3]()

        // Assert
        expect(confirm.mock.calls[0][0]).toBe(`alerts.actions.confirmations.status.${target}`)
        expect(updateAlertStatus).toHaveBeenCalledWith('a1', target)
    })

    it.each([
        ['softDelete', true, (): Mock => softDeleteAlert],
        ['restore', false, (): Mock => restoreAlert],
        ['hardDelete', true, (): Mock => hardDeleteAlert],
    ])('asks for a confirmation before %s, then calls the facade', (id: string, visible: boolean, call: () => Mock) => {
        // Arrange
        const action: ElementActionModel = actions.actionsFor(alertOf(AlertStatusEnum.IN_PROGRESS, visible)).find((it: ElementActionModel): boolean => it.id === id)!

        // Act
        action.run()
        confirm.mock.calls[0][3]()

        // Assert
        expect(call()).toHaveBeenCalledTimes(1)
    })

    it('gates softDelete and restore on their own authorities', () => {
        // Arrange
        const disabled = (element: AlertModel, id: string): boolean =>
            actions.actionsFor(element).find((it: ElementActionModel): boolean => it.id === id)!.disabled
        authorities.set(['p1_REGISTRY_PROJECT_ALERT_U', 'p1_REGISTRY_PROJECT_ALERT_D'])

        // Act
        const without: boolean[] = [disabled(alertOf(AlertStatusEnum.IN_PROGRESS), 'softDelete'), disabled(alertOf(AlertStatusEnum.IN_PROGRESS, false), 'restore')]
        authorities.set(['p1_REGISTRY_PROJECT_ALERT_U', 'p1_REGISTRY_PROJECT_ALERT_D', 'p1_REGISTRY_PROJECT_ALERT_SOFT_DELETE', 'p1_REGISTRY_PROJECT_ALERT_RESTORE'])
        const withThem: boolean[] = [disabled(alertOf(AlertStatusEnum.IN_PROGRESS), 'softDelete'), disabled(alertOf(AlertStatusEnum.IN_PROGRESS, false), 'restore')]

        // Assert
        expect(without).toEqual([true, true])
        expect(withThem).toEqual([false, false])
    })

    it('disables the commands the user has no authority for', () => {
        // Arrange
        authorities.set(['p1_REGISTRY_PROJECT_ALERT_U'])

        // Act
        const remove: ElementActionModel = actions.actionsFor(alertOf(AlertStatusEnum.IN_PROGRESS)).find((it: ElementActionModel): boolean => it.id === 'hardDelete')!

        // Assert
        expect(remove.disabled).toBe(true)
    })

})

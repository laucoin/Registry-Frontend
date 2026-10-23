import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ActivityActions } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-actions.service'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { ActivityModel } from '@shared/models/model/activity.model'

const VISIBLE: ActivityModel = { id: 'x1', visible: true } as ActivityModel
const HIDDEN: ActivityModel = { ...VISIBLE, visible: false }

describe('ActivityActions', () => {
    let actions: ActivityActions
    let authorities: WritableSignal<string[]>
    let facade: Record<string, Mock>
    let confirm: Mock<(confirmation: { accept: () => void, acceptSeverity: SeverityEnum }) => void>
    let navigateByUrl: Mock<(url: string) => Promise<boolean>>

    beforeEach(() => {
        RegistryConfig.config = { enabledActions: Object.values(ElementActionEnum) } as never
        authorities = signal(['p1_REGISTRY_PROJECT_ACTIVITY_U', 'p1_REGISTRY_PROJECT_ACTIVITY_D', 'p1_REGISTRY_PROJECT_ACTIVITY_HISTORY_R'])
        facade = { disableActivity: vi.fn(() => of(undefined)), enableActivity: vi.fn(() => of(undefined)), deleteActivity: vi.fn(() => of(undefined)) }
        confirm = vi.fn()
        navigateByUrl = vi.fn(() => Promise.resolve(true))
        TestBed.configureTestingModule({
            providers: [
                ActivityActions,
                { provide: ActivityFacade, useValue: facade },
                { provide: SessionFacade, useValue: { currentUser: (): unknown => ({ authorities: authorities() }), selectedProject: (): unknown => ({ id: 'p1' }), currentProjectId: (): string => 'p1' } },
                { provide: UiFacade, useValue: { confirm } },
                { provide: Router, useValue: { navigateByUrl } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        })
        actions = TestBed.inject(ActivityActions)
    })

    function ids(element: ActivityModel): string[] {
        return actions.actionsFor(element).map((action: ElementActionModel): string => action.id)
    }

    function find(element: ActivityModel, id: string): ElementActionModel {
        return actions.actionsFor(element).find((action: ElementActionModel): boolean => action.id === id)!
    }

    it('offers the history, edit, hide and delete commands for a visible element', () => {
        // Arrange
        const element: ActivityModel = VISIBLE

        // Act
        const shown: string[] = ids(element)

        // Assert
        expect(shown).toEqual(['movements-history', 'edit', 'disable', 'delete'])
    })

    it('offers show instead of hide for a hidden element', () => {
        // Arrange
        const element: ActivityModel = HIDDEN

        // Act
        const shown: string[] = ids(element)

        // Assert
        expect(shown).toEqual(['movements-history', 'edit', 'enable', 'delete'])
    })

    it('leaves out the commands that are not enabled in the configuration', () => {
        // Arrange
        RegistryConfig.config = { enabledActions: [ElementActionEnum.ACTIVITY_UPDATE] } as never

        // Act
        const shown: string[] = ids(VISIBLE)

        // Assert
        expect(shown).toEqual(['edit'])
    })

    it('disables the commands the user has no authority for', () => {
        // Arrange
        authorities.set(['p1_REGISTRY_PROJECT_ACTIVITY_U'])

        // Act
        const flags: boolean[] = ['movements-history', 'edit', 'delete'].map((id: string): boolean => find(VISIBLE, id).disabled)

        // Assert
        expect(flags).toEqual([true, false, true])
    })

    it('opens the history and edition routes of the element', () => {
        // Arrange
        const history: ElementActionModel = find(VISIBLE, 'movements-history')
        const edit: ElementActionModel = find(VISIBLE, 'edit')

        // Act
        history.run()
        edit.run()

        // Assert
        expect(navigateByUrl).toHaveBeenNthCalledWith(1, expect.stringContaining('x1'))
        expect(navigateByUrl).toHaveBeenNthCalledWith(2, expect.stringContaining('x1'))
    })

    it.each([
        ['disable', 'disableActivity', SeverityEnum.WARNING, VISIBLE, 'x1'],
        ['enable', 'enableActivity', SeverityEnum.INFO, HIDDEN, 'x1'],
        ['delete', 'deleteActivity', SeverityEnum.DANGER, VISIBLE, VISIBLE],
    ])('asks for a confirmation before running %s, then calls the facade', (id: string, call: string, severity: SeverityEnum, element: ActivityModel, argument: unknown) => {
        // Arrange
        const action: ElementActionModel = find(element, id)

        // Act
        action.run()
        const beforeAccept: number = facade[call].mock.calls.length
        confirm.mock.calls[0][0].accept()

        // Assert
        expect(beforeAccept).toBe(0)
        expect(confirm.mock.calls[0][0].acceptSeverity).toBe(severity)
        expect(facade[call]).toHaveBeenCalledWith(argument)
    })
})

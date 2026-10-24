import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantActions } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-actions.service'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

const VISIBLE: ParticipantModel = { id: 'x1', visible: true } as ParticipantModel
const HIDDEN: ParticipantModel = { ...VISIBLE, visible: false }

describe('ParticipantActions', () => {
    let actions: ParticipantActions
    let authorities: WritableSignal<string[]>
    let facade: Record<string, Mock>
    let groupFacade: { removeMemberFromGroup: Mock }
    let confirm: Mock<(confirmation: { accept: () => void, acceptSeverity: SeverityEnum }) => void>
    let navigateByUrl: Mock<(url: string) => Promise<boolean>>

    beforeEach(() => {
        authorities = signal(['p1_REGISTRY_PROJECT_PARTICIPANT_U', 'p1_REGISTRY_PROJECT_PARTICIPANT_D', 'p1_REGISTRY_PROJECT_PARTICIPANT_HISTORY_R'])
        facade = { disableParticipant: vi.fn(() => of(undefined)), enableParticipant: vi.fn(() => of(undefined)), deleteParticipant: vi.fn(() => of(undefined)), exportParticipant: vi.fn(() => of(undefined)) }
        groupFacade = { removeMemberFromGroup: vi.fn(() => of(undefined)) }
        confirm = vi.fn()
        navigateByUrl = vi.fn(() => Promise.resolve(true))
        TestBed.configureTestingModule({
            providers: [
                ParticipantActions,
                { provide: ParticipantFacade, useValue: facade },
                { provide: GroupFacade, useValue: groupFacade },
                { provide: SessionFacade, useValue: { currentUser: (): unknown => ({ id: 'me', authorities: authorities() }), selectedProject: (): unknown => ({ id: 'p1' }), currentProjectId: (): string => 'p1' } },
                { provide: UiFacade, useValue: { confirm } },
                { provide: Router, useValue: { navigateByUrl } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        })
        actions = TestBed.inject(ParticipantActions)
    })

    function ids(element: ParticipantModel, groupId?: string): string[] {
        return actions.actionsFor(element, groupId).map((action: ElementActionModel): string => action.id)
    }

    function find(element: ParticipantModel, id: string): ElementActionModel {
        return actions.actionsFor(element).find((action: ElementActionModel): boolean => action.id === id)!
    }

    it('offers the history, edit, hide, export and delete commands for a visible element', () => {
        // Arrange
        const element: ParticipantModel = VISIBLE

        // Act
        const shown: string[] = ids(element)

        // Assert
        expect(shown).toEqual(['movements-history', 'edit', 'disable', 'export', 'delete'])
    })

    it('offers show instead of hide and no deletion for a hidden participant', () => {
        // Arrange
        const element: ParticipantModel = HIDDEN

        // Act
        const shown: string[] = ids(element)

        // Assert
        expect(shown).toEqual(['movements-history', 'edit', 'enable', 'export'])
    })

    it('disables the export for a user who is neither an administrator nor the linked user', () => {
        // Arrange
        const element: ParticipantModel = { ...VISIBLE, user: { id: 'other' } } as ParticipantModel

        // Act
        const disabled: boolean = find(element, 'export').disabled

        // Assert
        expect(disabled).toBe(true)
    })

    it('allows the export to the user linked to the participant', () => {
        // Arrange
        const element: ParticipantModel = { ...VISIBLE, user: { id: 'me' } } as ParticipantModel

        // Act
        const disabled: boolean = find(element, 'export').disabled

        // Assert
        expect(disabled).toBe(false)
    })

    it('allows the export to a project administrator and runs it', () => {
        // Arrange
        authorities.set(['p1_REGISTRY_PROJECT_PARTICIPANT_EXPORT'])
        const exportAction: ElementActionModel = find(VISIBLE, 'export')

        // Act
        exportAction.run()

        // Assert
        expect(exportAction.disabled).toBe(false)
        expect(facade['exportParticipant']).toHaveBeenCalledWith(VISIBLE)
    })

    it('disables the commands the user has no authority for', () => {
        // Arrange
        authorities.set(['p1_REGISTRY_PROJECT_PARTICIPANT_U'])

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
        ['disable', 'disableParticipant', SeverityEnum.WARNING, VISIBLE, 'x1'],
        ['enable', 'enableParticipant', SeverityEnum.INFO, HIDDEN, 'x1'],
        ['delete', 'deleteParticipant', SeverityEnum.DANGER, VISIBLE, VISIBLE],
    ])('asks for a confirmation before running %s, then calls the facade', (id: string, call: string, severity: SeverityEnum, element: ParticipantModel, argument: unknown) => {
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

    it('offers to remove the participant from the group it is listed in', () => {
        // Arrange
        const element: ParticipantModel = VISIBLE

        // Act
        const shown: string[] = ids(element, 'g1')

        // Assert
        expect(shown).toEqual(['movements-history', 'edit', 'disable', 'remove-member', 'export', 'delete'])
    })

    it('asks for a confirmation before removing a member, then calls the group facade', () => {
        // Arrange
        authorities.set(['p1_REGISTRY_PROJECT_GROUP_U'])
        const action: ElementActionModel = actions.actionsFor(VISIBLE, 'g1').find((entry: ElementActionModel): boolean => entry.id === 'remove-member')!

        // Act
        action.run()
        confirm.mock.calls[0][0].accept()

        // Assert
        expect(action.disabled).toBe(false)
        expect(confirm.mock.calls[0][0].acceptSeverity).toBe(SeverityEnum.WARNING)
        expect(groupFacade.removeMemberFromGroup).toHaveBeenCalledWith('g1', VISIBLE)
    })
})

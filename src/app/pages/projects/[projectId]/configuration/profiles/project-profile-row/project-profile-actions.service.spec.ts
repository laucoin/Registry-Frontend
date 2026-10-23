import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileActions } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-actions.service'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'

const OTHER: ProjectProfileModel = {
    id: 'pp1', visible: true, user: { id: 'u2' }, projectId: 'p1', status: { value: ProfileStatusEnum.ACCEPTED },
} as ProjectProfileModel
const OWN: ProjectProfileModel = { ...OTHER, user: { id: 'u1' } } as ProjectProfileModel
const BLOCKED: ProjectProfileModel = { ...OTHER, visible: false }
const INVITATION: UserInvitationModel = { id: 'pp2', visible: true, project: { id: 'p2', name: 'Other camp' }, status: { value: ProfileStatusEnum.INVITED } } as UserInvitationModel

describe('ProjectProfileActions', () => {
    let actions: ProjectProfileActions
    let authorities: WritableSignal<string[]>
    let selectedProject: WritableSignal<{ id: string }>
    let facade: Record<string, Mock>
    let userProfileFacade: { manageProjectInvitationAcceptance: Mock }
    let confirm: Mock<(confirmation: { accept: () => void, acceptSeverity: SeverityEnum }) => void>
    let navigateByUrl: Mock<(url: string) => Promise<boolean>>

    beforeEach(() => {
        RegistryConfig.config = { enabledActions: Object.values(ElementActionEnum) } as never
        authorities = signal(['p1_REGISTRY_PROJECT_PROFILE_U', 'p1_REGISTRY_PROJECT_PROFILE_D'])
        selectedProject = signal({ id: 'p1' })
        facade = { blockProjectProfile: vi.fn(() => of(undefined)), unblockProjectProfile: vi.fn(() => of(undefined)), deleteProjectProfile: vi.fn(() => of(undefined)) }
        userProfileFacade = { manageProjectInvitationAcceptance: vi.fn() }
        confirm = vi.fn()
        navigateByUrl = vi.fn(() => Promise.resolve(true))
        TestBed.configureTestingModule({
            providers: [
                ProjectProfileActions,
                { provide: ProjectProfileFacade, useValue: facade },
                { provide: UserProfileFacade, useValue: userProfileFacade },
                { provide: SessionFacade, useValue: { currentUser: (): unknown => ({ id: 'u1', authorities: authorities() }), selectedProject, currentProjectId: (): string => 'p1' } },
                { provide: UiFacade, useValue: { confirm } },
                { provide: Router, useValue: { navigateByUrl } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => key } },
            ],
        })
        actions = TestBed.inject(ProjectProfileActions)
    })

    function ids(profile: ProjectProfileModel): string[] {
        return actions.actionsFor(profile).map((action: ElementActionModel): string => action.id)
    }

    function find(profile: ProjectProfileModel, id: string): ElementActionModel {
        return actions.actionsFor(profile).find((action: ElementActionModel): boolean => action.id === id)!
    }

    it('offers edit, block and delete on the profile of someone else', () => {
        // Arrange
        const profile: ProjectProfileModel = OTHER

        // Act
        const shown: string[] = ids(profile)

        // Assert
        expect(shown).toEqual(['edit', 'disable', 'delete'])
    })

    it('offers unblock instead of block for a blocked profile', () => {
        // Arrange
        const profile: ProjectProfileModel = BLOCKED

        // Act
        const shown: string[] = ids(profile)

        // Assert
        expect(shown).toEqual(['edit', 'enable', 'delete'])
    })

    it('offers to select the project of an own profile, unless it is already the selected one', () => {
        // Arrange
        selectedProject.set({ id: 'p2' })

        // Act
        const whenAnotherIsSelected: string[] = ids(OWN)
        selectedProject.set({ id: 'p1' })
        const whenSelected: string[] = ids(OWN)

        // Assert
        expect(whenAnotherIsSelected).toEqual(['select', 'delete'])
        expect(whenSelected).toEqual(['delete'])
    })

    it('disables the commands the user has no authority for', () => {
        // Arrange
        authorities.set(['p1_REGISTRY_PROJECT_PROFILE_U'])

        // Act
        const flags: boolean[] = [find(OTHER, 'edit').disabled, find(OTHER, 'delete').disabled]

        // Assert
        expect(flags).toEqual([false, true])
    })

    it('opens the edition and the project routes', () => {
        // Arrange
        selectedProject.set({ id: 'p2' })

        // Act
        find(OTHER, 'edit').run()
        find(OWN, 'select').run()

        // Assert
        expect(navigateByUrl).toHaveBeenNthCalledWith(1, expect.stringContaining('pp1'))
        expect(navigateByUrl).toHaveBeenNthCalledWith(2, expect.stringContaining('p1'))
    })

    it.each([
        ['disable', 'blockProjectProfile', SeverityEnum.WARNING, OTHER],
        ['enable', 'unblockProjectProfile', SeverityEnum.INFO, BLOCKED],
        ['delete', 'deleteProjectProfile', SeverityEnum.DANGER, OTHER],
    ])('asks for a confirmation before running %s, then calls the facade', (id: string, call: string, severity: SeverityEnum, profile: ProjectProfileModel) => {
        // Arrange
        const action: ElementActionModel = find(profile, id)

        // Act
        action.run()
        const beforeAccept: number = facade[call].mock.calls.length
        confirm.mock.calls[0][0].accept()

        // Assert
        expect(beforeAccept).toBe(0)
        expect(confirm.mock.calls[0][0].acceptSeverity).toBe(severity)
        expect(facade[call]).toHaveBeenCalledWith(profile)
    })

    it.each([
        [ProfileStatusEnum.ACCEPTED, true, SeverityEnum.SUCCESS],
        [ProfileStatusEnum.REJECTED, false, SeverityEnum.DANGER],
    ])('asks for a confirmation before answering an invitation with %s', (status: ProfileStatusEnum, accepted: boolean, severity: SeverityEnum) => {
        // Arrange
        const invitation: ProjectProfileModel = OWN

        // Act
        actions.manageAcceptance(invitation, status)
        const beforeAccept: number = userProfileFacade.manageProjectInvitationAcceptance.mock.calls.length
        confirm.mock.calls[0][0].accept()

        // Assert
        expect(beforeAccept).toBe(0)
        expect(confirm.mock.calls[0][0].acceptSeverity).toBe(severity)
        expect(userProfileFacade.manageProjectInvitationAcceptance).toHaveBeenCalledWith('pp1', accepted)
    })
    it('treats a profile listed from the user side as an own profile', () => {
        // Arrange
        const profile: UserInvitationModel = INVITATION

        // Act
        const shown: string[] = actions.actionsFor(profile).map((action: ElementActionModel): string => action.id)

        // Assert
        expect(shown).toContain('select')
        expect(shown).not.toContain('edit')
        expect(shown).not.toContain('disable')
        expect(shown).toContain('delete')
    })

    it('opens the project of a profile listed from the user side', () => {
        // Arrange
        const select: ElementActionModel = actions.actionsFor(INVITATION).find((action: ElementActionModel): boolean => action.id === 'select')!

        // Act
        select.run!()

        // Assert
        expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('p2'))
    })
})

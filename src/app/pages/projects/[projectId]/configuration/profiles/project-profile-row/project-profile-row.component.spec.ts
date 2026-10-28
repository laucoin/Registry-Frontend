import { NgTemplateOutlet } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { ProjectProfileActions } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-actions.service'
import { ProjectProfileRowComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-row.component'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ListedProfileModel } from '@shared/models/model/listed-profile.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'

@Component({
    imports: [ProjectProfileRowComponent, NgTemplateOutlet],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    template: `
        <app-project-profile-row #row [view]="view()"/>
        <ng-container [ngTemplateOutlet]="row.template()" [ngTemplateOutletContext]="{ $implicit: profile() }"/>
    `,
})
class HostComponent {
    public readonly view: WritableSignal<'user' | 'project'> = signal('user')
    public readonly profile: WritableSignal<ListedProfileModel> = signal<ListedProfileModel>(PROFILE)
}

const PROFILE: ProjectProfileModel = {
    id: 'pp1',
    visible: true,
    user: { id: 'u2', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org' },
    projectId: 'p1',
    role: { value: 'ADMIN', label: 'Administrator' },
    status: { value: ProfileStatusEnum.ACCEPTED, label: 'Accepted' },
    availabilityStatus: { value: AvailabilityStatusEnum.AVAILABLE, label: 'Available' },
    startAccess: undefined,
    endAccess: undefined,
} as unknown as ProjectProfileModel

const INVITATION: UserInvitationModel = {
    id: 'pp1',
    visible: true,
    projectId: 'p1',
    project: { id: 'p1', name: 'Camp Vercors' },
    role: { value: 'ADMIN', label: 'Administrator' },
    status: { value: ProfileStatusEnum.ACCEPTED, label: 'Accepted' },
    availabilityStatus: { value: AvailabilityStatusEnum.AVAILABLE, label: 'Available' },
    startAccess: undefined,
    endAccess: undefined,
} as unknown as UserInvitationModel

describe('ProjectProfileRowComponent', () => {
    let fixture: ComponentFixture<HostComponent>
    let manageAcceptance: Mock<(profile: ProjectProfileModel, status: ProfileStatusEnum) => void>
    let toggleProjectFavorite: Mock<(profile: UserInvitationModel) => void>

    const text = (selector: string): string | undefined => fixture.nativeElement.querySelector(selector)?.textContent?.trim()
    const tags = (): string[] => Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-tag')).map((tag: HTMLElement): string => tag.textContent!.trim())

    async function render(profile: ListedProfileModel, view: 'user' | 'project' = 'user'): Promise<void> {
        fixture.componentInstance.profile.set(profile)
        fixture.componentInstance.view.set(view)
        await fixture.whenStable()
    }

    beforeEach(async () => {
        manageAcceptance = vi.fn()
        toggleProjectFavorite = vi.fn()
        TestBed.configureTestingModule({
            imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
            providers: [
                provideRouter([]),
                { provide: UserProfileFacade, useValue: { toggleProjectFavorite } },
                { provide: SessionFacade, useValue: { currentUser: (): unknown => ({ id: 'u1' }), selectedProject: (): undefined => undefined } },
            ],
        })
        TestBed.overrideComponent(ProjectProfileRowComponent, {
            set: { providers: [{ provide: ProjectProfileActions, useFactory: (): object => ({ actionsFor: (): never[] => [], manageAcceptance }) }] },
        })
        fixture = TestBed.createComponent(HostComponent)
        await fixture.whenStable()
    })

    it('should title the row with the project from the user side', async () => {
        // Arrange
        await render(INVITATION, 'user')

        // Act
        const title: string | undefined = text('sgdf-list-item span.block.truncate')

        // Assert
        expect(title).toBe('Camp Vercors')
    })

    it('should show a pressed star for the project of a profile that is a favorite', async () => {
        // Arrange
        await render({ ...INVITATION, project: { ...INVITATION.project!, favorite: true } })

        // Act
        const star: Element | null = fixture.nativeElement.querySelector('app-favorite-toggle sgdf-icon-button')

        // Assert
        expect(star?.getAttribute('aria-pressed')).toBe('true')
    })

    it('should toggle the favorite of the project when the star is clicked', async () => {
        // Arrange
        await render(INVITATION)

        // Act
        fixture.nativeElement.querySelector('app-favorite-toggle sgdf-icon-button').click()

        // Assert
        expect(toggleProjectFavorite).toHaveBeenCalledWith(INVITATION)
    })

    it('should offer no star while the invitation awaits an answer, nor from the project side', async () => {
        // Arrange
        await render({ ...INVITATION, status: { value: ProfileStatusEnum.INVITED, label: 'Invited' } } as UserInvitationModel)
        const awaiting: Element | null = fixture.nativeElement.querySelector('app-favorite-toggle')
        await render(PROFILE, 'project')

        // Act
        const fromProject: Element | null = fixture.nativeElement.querySelector('app-favorite-toggle')

        // Assert
        expect(awaiting).toBeNull()
        expect(fromProject).toBeNull()
    })

    it('should title the row with the person from the project side', async () => {
        // Arrange
        await render(PROFILE, 'project')

        // Act
        const title: string | undefined = text('sgdf-list-item span.block.truncate')

        // Assert
        expect(title).toBe('Ada LOVELACE')
        expect(fixture.nativeElement.querySelector('sgdf-avatar').getAttribute('ng-reflect-initials') ?? fixture.nativeElement.querySelector('sgdf-avatar').initials).toBe('AL')
    })

    it('should fall back on the email of a person without a name', async () => {
        // Arrange
        await render({ ...PROFILE, user: { ...PROFILE.user, firstName: undefined, lastName: undefined } } as ProjectProfileModel, 'project')

        // Act
        const title: string | undefined = text('sgdf-list-item span.block.truncate')

        // Assert
        expect(title).toBe('ada@example.org')
    })

    it('should show the role, the availability and the status of an answered profile', async () => {
        // Arrange
        await render(PROFILE)

        // Act
        const shown: string[] = tags()

        // Assert
        expect(shown).toEqual(['Administrator', 'Available', 'Accepted'])
        expect(fixture.nativeElement.querySelector('sgdf-button')).toBeNull()
    })

    it('should let the invited user accept or reject the invitation', async () => {
        // Arrange
        const invitation: ProjectProfileModel = { ...PROFILE, user: { ...PROFILE.user, id: 'u1' }, status: { value: ProfileStatusEnum.INVITED, label: 'Invited' } } as ProjectProfileModel
        await render(invitation)
        const [reject, accept]: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-button'))

        // Act
        reject.click()
        accept.click()

        // Assert
        expect(manageAcceptance).toHaveBeenNthCalledWith(1, invitation, ProfileStatusEnum.REJECTED)
        expect(manageAcceptance).toHaveBeenNthCalledWith(2, invitation, ProfileStatusEnum.ACCEPTED)
    })

    it.each([
        [ProfileStatusEnum.ACCEPTED, 'success'],
        [ProfileStatusEnum.REJECTED, 'warning'],
        [ProfileStatusEnum.BLOCKED, 'danger'],
        [ProfileStatusEnum.INVITED, 'info'],
    ])('should show the %s status in the %s tag variant', async (status: ProfileStatusEnum, variant: string) => {
        // Arrange
        await render({ ...PROFILE, status: { value: status, label: 'S' } } as ProjectProfileModel)

        // Act
        const statusTag: Element = Array.from(fixture.nativeElement.querySelectorAll('sgdf-tag')).pop() as Element

        // Assert
        expect(statusTag.getAttribute('variant')).toBe(variant)
    })
})

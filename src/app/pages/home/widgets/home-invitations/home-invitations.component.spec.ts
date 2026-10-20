import { signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { INVITATION_DTO } from '@shared/helpers/testing/response-fixtures'
import { pageOf } from '@shared/helpers/testing/test-fixtures'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { UserInvitationMapper } from '@shared/mappers/user-invitation.mapper'
import { NotificationModel } from '@shared/models/model/notification.model'
import { PageModel } from '@shared/models/model/page.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'
import { HomeInvitationsComponent } from './home-invitations.component'

function invitations(count: number): UserInvitationModel[] {
	return Array.from({ length: count }, (_: unknown, index: number): UserInvitationModel => ({ ...UserInvitationMapper.toModel(INVITATION_DTO), id: `i${index}` }))
}

describe('HomeInvitationsComponent', () => {
	let fixture: ComponentFixture<HomeInvitationsComponent>
	let page: WritableSignal<PageModel<UserInvitationModel> | undefined>
	let fetch: ReturnType<typeof vi.fn>
	let manage: ReturnType<typeof vi.fn>

	async function render(): Promise<void> {
		fixture = TestBed.createComponent(HomeInvitationsComponent)
		await fixture.whenStable()
	}

	beforeEach(async () => {
		page = signal<PageModel<UserInvitationModel> | undefined>(undefined)
		fetch = vi.fn()
		manage = vi.fn()
		await MockBuilder(HomeInvitationsComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(PluralTranslationPipe, (key: string): string => key)
			.provide({
				provide: UserProfileFacade,
				useValue: {
					userProjectProfileInvitationsPage: page,
					userProjectProfileInvitationsPageLoading: signal(false),
					userProjectProfileInvitationsPageError: signal<NotificationModel | undefined>(undefined),
					fetchProjectProfileInvitationPage: fetch,
					manageProjectInvitationAcceptance: manage,
				},
			})
	})

	it('should load the first invitations when displayed', async () => {
		await render()

		expect(fetch).toHaveBeenCalledWith(0, 3)
	})

	it('should show no more than three invitations', async () => {
		// Arrange
		page.set({ ...pageOf(invitations(5)), totalElements: 5 })

		// Act
		await render()

		// Assert
		expect(fixture.nativeElement.querySelectorAll('sgdf-table-row:not([aria-hidden])').length).toBe(1 + 3 + 1)
	})

	it('should accept and refuse an invitation', async () => {
		// Arrange
		page.set(pageOf(invitations(1)))
		await render()
		const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-button[size="small"]'))

		// Act
		buttons[0].click()
		buttons[1].click()

		// Assert
		expect(manage).toHaveBeenNthCalledWith(1, 'i0', false)
		expect(manage).toHaveBeenNthCalledWith(2, 'i0', true)
	})

	it('should tell that no invitation is pending', async () => {
		// Arrange
		page.set({ ...pageOf<UserInvitationModel>([]), totalElements: 0 })

		// Act
		await render()

		// Assert
		expect(fixture.nativeElement.textContent).toContain('home.invitations.empty')
	})
})

import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/button'
import '@sgdf/ui/skeleton'
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { NotificationModel } from '@shared/models/model/notification.model'
import { PageModel } from '@shared/models/model/page.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'

const PAGE_SIZE: number = 3

/**
 * Purpose: Shows the pending project invitations of the signed-in user on the home page.
 * Scope: Loads the first invitations, lets the user accept or refuse each one, and links to the full list.
 * Limits: Reads the user profile facade only; it shows a few rows and counts the others.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-home-invitations',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home')],
	imports: [TranslocoPipe, PluralTranslationPipe, RouterLink, SectionErrorComponent],
	templateUrl: './home-invitations.component.html',
})
export class HomeInvitationsComponent implements OnInit {
	private readonly facade: UserProfileFacade = inject(UserProfileFacade)

	protected readonly page: Signal<PageModel<UserInvitationModel> | undefined> = this.facade.userProjectProfileInvitationsPage
	protected readonly loading: Signal<boolean> = this.facade.userProjectProfileInvitationsPageLoading
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.userProjectProfileInvitationsPageError
	protected readonly total: Signal<number | undefined> = computed((): number | undefined => this.page()?.totalElements)
	protected readonly invitations: Signal<UserInvitationModel[]> = computed((): UserInvitationModel[] => (this.page()?.content ?? []).slice(0, PAGE_SIZE))
	protected readonly invitationsLink: string = RegistryRouteEnum.MY_ACCOUNT_INVITATIONS
	protected readonly skeletonRows: readonly number[] = [1, 2, 3]

	public ngOnInit(): void {
		this.reload()
	}

	protected reload(): void {
		this.facade.fetchProjectProfileInvitationPage(0, PAGE_SIZE)
	}

	protected answer(invitation: UserInvitationModel, accepted: boolean): void {
		this.facade.manageProjectInvitationAcceptance(invitation.id, accepted)
	}
}

import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { HomeFacade } from '@pages/home/data/state/home.facade';
import { HomePage } from '@pages/home/home.page';
import { HomeHarness } from '@pages/home/testing/home.harness';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';
import { CurrentUserModel } from '@shared/models/model/current-user.model';

@Component({ template: '' })
class EmptyComponent {}

describe('HomePage', () => {
	function create(user: Partial<CurrentUserModel> | undefined): Promise<HomeHarness> {
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { home: { greeting: 'Hello {{ name }}' } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				REFRESH_SERVICE_STUB,
				{ provide: SessionFacade, useValue: { currentUser: signal(user) } },
				{ provide: ElementConfirmationService, useValue: { confirm: vi.fn() } },
				{
					provide: HomeFacade,
					useValue: {
						favorites: signal([]),
						favoritesTotal: signal(undefined),
						favoritesLoading: signal(false),
						favoritesError: signal(undefined),
						fetchFavorites: vi.fn(),
						attention: signal([]),
						attentionLoading: signal(false),
						attentionError: signal(undefined),
						fetchAttention: vi.fn(),
					},
				},
				{
					provide: UserProfileFacade,
					useValue: {
						userProjectProfileInvitationsPage: signal(undefined),
						userProjectProfileInvitationsPageLoading: signal(false),
						userProjectProfileInvitationsPageError: signal(undefined),
						fetchProjectProfileInvitationPage: vi.fn(),
					},
				},
			],
		});
		return TestbedHarnessEnvironment.harnessForFixture(TestBed.createComponent(HomePage), HomeHarness);
	}

	beforeEach(() => {
		RegistryConfig.config = { application: { support: {} } } as ConfigModel;
	});

	it('greets the user and lays out the four widgets', async () => {
		// Arrange
		const harness = await create({ firstName: 'Luc', authorities: [] });

		// Act
		const widgets = await Promise.all([
			harness.favorites(),
			harness.invitations(),
			harness.attention(),
			harness.quickAccess(),
		]);

		// Assert
		expect([await harness.title(), widgets.length]).toEqual(['Hello Luc', 4]);
	});

	it('greets a user still loading without a name', async () => {
		// Arrange
		const harness = await create(undefined);

		// Act
		const title = await harness.title();

		// Assert
		expect([title, await harness.canCreate()]).toEqual(['Hello', false]);
	});

	it.each([
		{
			name: 'offers to create a project to a user allowed to',
			authorities: [UserAuthorityEnum.REGISTRY_PROJECT_C],
			shown: true,
		},
		{ name: 'hides the project creation from the others', authorities: [], shown: false },
	])('$name', async ({ authorities, shown }) => {
		// Arrange
		const harness = await create({ firstName: 'Luc', authorities } as Partial<CurrentUserModel>);

		// Act
		const canCreate = await harness.canCreate();

		// Assert
		expect(canCreate).toBe(shown);
	});

	it('opens the project creation', async () => {
		// Arrange
		const harness = await create({
			firstName: 'Luc',
			authorities: [UserAuthorityEnum.REGISTRY_PROJECT_C],
		} as Partial<CurrentUserModel>);

		// Act
		await harness.create();

		// Assert
		expect(TestBed.inject(Router).url).toBe('/projects/create');
	});
});

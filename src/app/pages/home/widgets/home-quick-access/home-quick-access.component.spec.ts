import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { HomeQuickAccessComponent } from '@pages/home/widgets/home-quick-access/home-quick-access.component';
import { HomeQuickAccessHarness } from '@pages/home/widgets/home-quick-access/testing/home-quick-access.harness';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';
import { CurrentUserModel } from '@shared/models/model/current-user.model';

@Component({ template: '' })
class EmptyComponent {}

const internal = (label: string, href: string): { label: string; external: false; href: string; target: string } => ({
	label: `home.quickAccess.${label}`,
	external: false,
	href,
	target: '_self',
});

describe('HomeQuickAccessComponent', () => {
	function create(
		authorities: string[],
		documentationUrl?: string,
		issuesUrl?: string,
	): Promise<HomeQuickAccessHarness> {
		RegistryConfig.config = { application: { support: { documentationUrl, issuesUrl } } } as ConfigModel;
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				{
					provide: SessionFacade,
					useValue: { currentUser: signal({ authorities } as unknown as CurrentUserModel) },
				},
			],
		});
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(HomeQuickAccessComponent),
			HomeQuickAccessHarness,
		);
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
	});

	it('offers every shortcut, with the configured help and support in a new tab', async () => {
		// Arrange
		const harness = await create([UserAuthorityEnum.REGISTRY_USER_R], 'https://doc.test', 'https://issues.test');

		// Act
		const shortcuts = await harness.shortcuts();

		// Assert
		expect([await harness.title(), shortcuts]).toEqual([
			'fr.home.quickAccess.title',
			[
				internal('users', '/users'),
				internal('account', '/my-account'),
				internal('projects', '/projects'),
				{ label: 'home.quickAccess.help', external: true, href: 'https://doc.test', target: '_blank' },
				{ label: 'home.quickAccess.support', external: true, href: 'https://issues.test', target: '_blank' },
			],
		]);
	});

	it.each([
		{
			name: 'the users shortcut from a user who cannot read users',
			authorities: [],
			docs: 'https://doc.test',
			issues: 'https://issues.test',
			hidden: 'home.quickAccess.users',
		},
		{
			name: 'the help link without a documentation url',
			authorities: [UserAuthorityEnum.REGISTRY_USER_R],
			docs: undefined,
			issues: 'https://issues.test',
			hidden: 'home.quickAccess.help',
		},
		{
			name: 'the support link without an issues url',
			authorities: [UserAuthorityEnum.REGISTRY_USER_R],
			docs: 'https://doc.test',
			issues: undefined,
			hidden: 'home.quickAccess.support',
		},
	])('hides $name', async ({ authorities, docs, issues, hidden }) => {
		// Arrange
		const harness = await create(authorities, docs, issues);

		// Act
		const labels = (await harness.shortcuts()).map((shortcut) => shortcut.label);

		// Assert
		expect([labels.length, labels.includes(hidden)]).toEqual([4, false]);
	});

	it('opens an internal shortcut in the app', async () => {
		// Arrange
		const harness = await create([]);

		// Act
		await harness.follow('home.quickAccess.account');

		// Assert
		expect(TestBed.inject(Router).url).toBe('/my-account');
	});
});

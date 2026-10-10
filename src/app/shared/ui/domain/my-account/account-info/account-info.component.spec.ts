import { NgTemplateOutlet } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { MockBuilder } from 'ng-mocks';
import { AccountInfoComponent } from './account-info.component';

describe('AccountInfoComponent', () => {
	let user: WritableSignal<CurrentUserModel | undefined>;
	let fixture: ComponentFixture<AccountInfoComponent>;

	const buildUser = (firstName: string | undefined, lastName: string | undefined): CurrentUserModel => ({
		firstName,
		lastName,
		email: 'grace@example.test',
		role: { label: 'Admin', value: 'ADMIN' },
		lastLogin: new Date(),
	} as CurrentUserModel);

	beforeEach(async () => {
		RegistryConfig.config = { application: { organization: 'SGDF' } } as typeof RegistryConfig.config;
		user = signal<CurrentUserModel | undefined>(undefined);
		await MockBuilder(AccountInfoComponent)
			.keep(NgTemplateOutlet)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: SessionFacade, useValue: { currentUser: user } });
		fixture = TestBed.createComponent(AccountInfoComponent);
		await fixture.whenStable();
	});

	it('should show skeletons while the user is loading', () => {
		// Arrange
		const expected: number = 4;

		// Act
		const skeletons: number = fixture.nativeElement.querySelectorAll('sgdf-skeleton').length;

		// Assert
		expect(skeletons).toBe(expected);
	});

	it('should show the identity of the user', async () => {
		// Arrange
		user.set(buildUser('Grace', 'Hopper'));

		// Act
		await fixture.whenStable();

		// Assert
		const text: string = fixture.nativeElement.textContent;
		expect(text).toContain('Grace Hopper');
		expect(text).toContain('grace@example.test');
		expect(text).toContain('Admin');
		expect(fixture.nativeElement.querySelector('sgdf-relative-time')).not.toBeNull();
	});

	it('should fall back on the e-mail when the user has no name', async () => {
		// Arrange
		user.set(buildUser(undefined, undefined));

		// Act
		await fixture.whenStable();

		// Assert
		expect(fixture.componentInstance['fullName']()).toBe('grace@example.test');
	});
});

import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { firstValueFrom, isObservable, Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { userAuthorityGuard } from '@core/authentication/guard/user-authority.guard';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';
import { CurrentUserModel } from '@shared/models/model/current-user.model';

const userWith = (...authorities: UserAuthorityEnum[]): CurrentUserModel =>
	({ id: 'u1', authorities }) as unknown as CurrentUserModel;

describe('userAuthorityGuard', () => {
	let currentUser: WritableSignal<CurrentUserModel | undefined>;
	let currentUser$: Subject<CurrentUserModel>;

	function run(): boolean | UrlTree | Observable<boolean | UrlTree> {
		return TestBed.runInInjectionContext(() =>
			userAuthorityGuard(UserAuthorityEnum.REGISTRY_USER_R)(
				{} as ActivatedRouteSnapshot,
				{} as RouterStateSnapshot,
			),
		) as boolean | UrlTree | Observable<boolean | UrlTree>;
	}

	const home = (): string =>
		TestBed.inject(Router).serializeUrl(TestBed.inject(Router).parseUrl(RegistryRouteEnum.HOME));

	beforeEach(() => {
		currentUser = signal<CurrentUserModel | undefined>(undefined);
		currentUser$ = new Subject<CurrentUserModel>();
		TestBed.configureTestingModule({
			providers: [{ provide: SessionFacade, useValue: { currentUser, currentUser$ } }],
		});
	});

	it.each([
		{
			name: 'lets a user holding the authority through',
			user: userWith(UserAuthorityEnum.REGISTRY_USER_R),
			expected: true,
		},
		{
			name: 'sends a user without it to the home page',
			user: userWith(UserAuthorityEnum.REGISTRY_PROJECT_R),
			expected: 'home',
		},
	])('$name', ({ user, expected }) => {
		// Arrange
		currentUser.set(user);

		// Act
		const result = run();

		// Assert
		expect(result instanceof UrlTree ? 'home' : result).toBe(expected);
	});

	it('waits for the current user before deciding', async () => {
		// Arrange
		const result = run();
		const decision = isObservable(result) ? firstValueFrom(result) : Promise.resolve(result);

		// Act
		currentUser.set(userWith());
		currentUser$.next(userWith());

		// Assert
		expect(TestBed.inject(Router).serializeUrl((await decision) as UrlTree)).toBe(home());
	});
});

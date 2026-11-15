import { describe, expect, it } from 'vitest';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum';
import { ThemeEnum } from '@shared/models/enumeration/theme.enum';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';

const PROJECT = {
	id: 'p1',
	options: [{ label: 'Alerts', value: ProjectOptionEnum.ALERT }],
} as unknown as ProjectModel;

function userWith(...authorities: string[]): CurrentUserModel {
	return { id: 'u1', authorities } as CurrentUserModel;
}

describe('CurrentUserHelper', () => {
	describe('hasUserAuthority', () => {
		it('accepts a user holding the authority', () => {
			// Arrange
			const user = userWith(UserAuthorityEnum.REGISTRY_USER_R);

			// Act
			const result = CurrentUserHelper.hasUserAuthority(user, UserAuthorityEnum.REGISTRY_USER_R);

			// Assert
			expect(result).toBe(true);
		});

		it('rejects a user lacking the authority', () => {
			// Arrange
			const user = userWith(UserAuthorityEnum.REGISTRY_USER_R);

			// Act
			const result = CurrentUserHelper.hasUserAuthority(user, UserAuthorityEnum.REGISTRY_USER_D);

			// Assert
			expect(result).toBe(false);
		});

		it('rejects an unknown user', () => {
			// Arrange
			const user = undefined;

			// Act
			const result = CurrentUserHelper.hasUserAuthority(user, UserAuthorityEnum.REGISTRY_USER_R);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('hasProjectAuthorityOnAnyProject', () => {
		it.each([
			{
				name: 'granted on one project',
				authorities: [`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE}`],
				expected: true,
			},
			{
				name: 'only other authorities',
				authorities: [`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`],
				expected: false,
			},
		])('answers $expected for $name', ({ authorities, expected }) => {
			// Arrange
			const user = userWith(...authorities);

			// Act
			const granted = CurrentUserHelper.hasProjectAuthorityOnAnyProject(
				user,
				ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE,
			);

			// Assert
			expect(granted).toBe(expected);
		});

		it('rejects an unknown user', () => {
			// Arrange
			const user = undefined;

			// Act
			const granted = CurrentUserHelper.hasProjectAuthorityOnAnyProject(
				user,
				ProjectAuthorityEnum.REGISTRY_PROJECT_RESTORE,
			);

			// Assert
			expect(granted).toBe(false);
		});
	});

	describe('hasAnyProjectAuthority', () => {
		it.each([
			{
				name: 'a member of the project',
				authorities: [`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_U}`],
				id: 'p1',
				expected: true,
			},
			{
				name: 'a member of another project',
				authorities: [`p2_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`],
				id: 'p1',
				expected: false,
			},
			{
				name: 'a missing project id',
				authorities: [`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`],
				id: undefined,
				expected: false,
			},
		])('answers $expected for $name', ({ authorities, id, expected }) => {
			// Arrange
			const user = userWith(...authorities);

			// Act
			const member = CurrentUserHelper.hasAnyProjectAuthority(user, id);

			// Assert
			expect(member).toBe(expected);
		});

		it('rejects an unknown user', () => {
			// Arrange
			const user = undefined;

			// Act
			const member = CurrentUserHelper.hasAnyProjectAuthority(user, 'p1');

			// Assert
			expect(member).toBe(false);
		});
	});

	describe('hasProjectAuthority', () => {
		it.each([
			{ name: 'finds the authority of its own project', projectId: 'p1', expected: true },
			{ name: 'ignores the authority of another project', projectId: 'p2', expected: false },
		])('$name', ({ projectId, expected }) => {
			// Arrange
			const user = userWith(`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`);

			// Act
			const result = CurrentUserHelper.hasProjectAuthority(
				user,
				projectId,
				ProjectAuthorityEnum.REGISTRY_PROJECT_R,
			);

			// Assert
			expect(result).toBe(expected);
		});

		it.each([
			{ name: 'an unknown user', user: undefined, projectId: 'p1' },
			{
				name: 'a missing project id',
				user: userWith(`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`),
				projectId: undefined,
			},
		])('rejects $name', ({ user, projectId }) => {
			// Arrange
			const authority = ProjectAuthorityEnum.REGISTRY_PROJECT_R;

			// Act
			const result = CurrentUserHelper.hasProjectAuthority(user, projectId, authority);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('isFeasible', () => {
		it('is never feasible without a user', () => {
			// Arrange
			const item = {
				requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_R,
			};

			// Act
			const result = CurrentUserHelper.isFeasible(undefined, PROJECT, item);

			// Assert
			expect(result).toBe(false);
		});

		it.each([
			{ name: 'a project option', item: { requiredProjectOption: ProjectOptionEnum.ALERT } },
			{
				name: 'a project authority',
				item: { requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_R },
			},
		])('is infeasible when $name is required but no project is selected', ({ item }) => {
			// Arrange
			const user = userWith();

			// Act
			const result = CurrentUserHelper.isFeasible(user, undefined, item);

			// Assert
			expect(result).toBe(false);
		});

		it.each([
			{
				name: 'is feasible when the option and both authorities are met',
				user: userWith(
					UserAuthorityEnum.REGISTRY_USER_R,
					`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_R}`,
				),
				project: PROJECT,
				expected: true,
			},
			{
				name: 'is infeasible without the project authority',
				user: userWith(UserAuthorityEnum.REGISTRY_USER_R),
				project: PROJECT,
				expected: false,
			},
			{
				name: 'is infeasible without the project option',
				user: userWith(
					UserAuthorityEnum.REGISTRY_USER_R,
					`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_R}`,
				),
				project: { id: 'p1', options: [] } as unknown as ProjectModel,
				expected: false,
			},
		])('$name', ({ user, project, expected }) => {
			// Arrange
			const item = {
				requiredProjectOption: ProjectOptionEnum.ALERT,
				requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_R,
				requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_R,
			};

			// Act
			const result = CurrentUserHelper.isFeasible(user, project, item);

			// Assert
			expect(result).toBe(expected);
		});

		it('is feasible when nothing is required', () => {
			// Arrange
			const user = userWith();

			// Act
			const result = CurrentUserHelper.isFeasible(user, undefined, {});

			// Assert
			expect(result).toBe(true);
		});
	});

	describe('theme mapping', () => {
		it.each([
			['DARK', ThemeEnum.DARK],
			['LIGHT', ThemeEnum.LIGHT],
			['anything', ThemeEnum.SYSTEM],
		])('maps %s to its theme', (stored, expected) => {
			// Arrange
			const value = stored;

			// Act
			const theme = CurrentUserHelper.mapThemeToEnum(value);

			// Assert
			expect(theme).toBe(expected);
		});

		it.each([
			['FAST', RefreshModeEnum.FAST],
			['anything', RefreshModeEnum.NORMAL],
			[undefined, RefreshModeEnum.NORMAL],
		])('maps the refresh mode %s to %s', (stored, expected) => {
			// Arrange
			const value = stored;

			// Act
			const mode = CurrentUserHelper.mapRefreshModeToEnum(value);

			// Assert
			expect(mode).toBe(expected);
		});

		it.each([
			[ThemeEnum.DARK, 'DARK'],
			[ThemeEnum.LIGHT, 'LIGHT'],
			[ThemeEnum.SYSTEM, 'SYSTEM'],
		])('stores %s as %s', (theme, expected) => {
			// Arrange
			const value = theme;

			// Act
			const stored = CurrentUserHelper.mapThemeToString(value);

			// Assert
			expect(stored).toBe(expected);
		});
	});
});

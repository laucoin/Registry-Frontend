import { describe, expect, it } from 'vitest';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
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

	describe('hasProjectAuthority', () => {
		it('looks for the authority prefixed by the project id', () => {
			// Arrange
			const user = userWith(`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`);

			// Act
			const own = CurrentUserHelper.hasProjectAuthority(user, 'p1', ProjectAuthorityEnum.REGISTRY_PROJECT_R);
			const other = CurrentUserHelper.hasProjectAuthority(user, 'p2', ProjectAuthorityEnum.REGISTRY_PROJECT_R);

			// Assert
			expect(own).toBe(true);
			expect(other).toBe(false);
		});

		it('rejects an unknown user or a missing project id', () => {
			// Arrange
			const user = userWith(`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_R}`);

			// Act
			const noUser = CurrentUserHelper.hasProjectAuthority(
				undefined,
				'p1',
				ProjectAuthorityEnum.REGISTRY_PROJECT_R,
			);
			const noProject = CurrentUserHelper.hasProjectAuthority(
				user,
				undefined,
				ProjectAuthorityEnum.REGISTRY_PROJECT_R,
			);

			// Assert
			expect(noUser).toBe(false);
			expect(noProject).toBe(false);
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

		it('is infeasible when a project requirement exists but no project is selected', () => {
			// Arrange
			const user = userWith();

			// Act
			const byOption = CurrentUserHelper.isFeasible(user, undefined, {
				requiredProjectOption: ProjectOptionEnum.ALERT,
			});
			const byAuthority = CurrentUserHelper.isFeasible(user, undefined, {
				requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_R,
			});

			// Assert
			expect(byOption).toBe(false);
			expect(byAuthority).toBe(false);
		});

		it('requires the project option, the user authority and the project authority together', () => {
			// Arrange
			const user = userWith(
				UserAuthorityEnum.REGISTRY_USER_R,
				`p1_${ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_R}`,
			);
			const item = {
				requiredProjectOption: ProjectOptionEnum.ALERT,
				requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_R,
				requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_R,
			};

			// Act
			const allMet = CurrentUserHelper.isFeasible(user, PROJECT, item);
			const missingProjectAuthority = CurrentUserHelper.isFeasible(
				userWith(UserAuthorityEnum.REGISTRY_USER_R),
				PROJECT,
				item,
			);
			const missingOption = CurrentUserHelper.isFeasible(
				user,
				{ id: 'p1', options: [] } as unknown as ProjectModel,
				item,
			);

			// Assert
			expect(allMet).toBe(true);
			expect(missingProjectAuthority).toBe(false);
			expect(missingOption).toBe(false);
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

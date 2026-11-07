import { describe, expect, it } from 'vitest';

import { ProjectHelper } from '@shared/helpers/project.helper';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { ProjectModel } from '@shared/models/model/project.model';

const PROJECT = {
	id: 'p1',
	options: [{ label: 'Vehicles', value: ProjectOptionEnum.VEHICLE }],
} as unknown as ProjectModel;

describe('ProjectHelper', () => {
	it('finds an option the project has', () => {
		// Arrange
		const option: ProjectOptionEnum = ProjectOptionEnum.VEHICLE;

		// Act
		const result = ProjectHelper.hasOption(PROJECT, option);

		// Assert
		expect(result).toBe(true);
	});

	it('rejects an option the project lacks', () => {
		// Arrange
		const option: ProjectOptionEnum = ProjectOptionEnum.ALERT;

		// Act
		const result = ProjectHelper.hasOption(PROJECT, option);

		// Assert
		expect(result).toBe(false);
	});

	it('rejects any option for a project without options', () => {
		// Arrange
		const project = { id: 'p2' } as ProjectModel;

		// Act
		const result = ProjectHelper.hasOption(project, ProjectOptionEnum.ALERT);

		// Assert
		expect(result).toBe(false);
	});

	it('imposes nothing when there is no project or no required option', () => {
		// Arrange
		const withoutProject = ProjectHelper.hasOption(undefined, ProjectOptionEnum.ALERT);

		// Act
		const withoutOption = ProjectHelper.hasOption(PROJECT, undefined);

		// Assert
		expect(withoutProject).toBe(true);
		expect(withoutOption).toBe(true);
	});
});

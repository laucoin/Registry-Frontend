import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProjectFormStepperComponent } from '@pages/projects/project-form/project-form-stepper/project-form-stepper.component';
import { ProjectFormStepperHarness } from '@pages/projects/project-form/project-form-stepper/testing/project-form-stepper.harness';

describe('ProjectFormStepperComponent', () => {
	function create(active: number, withInvitation: boolean): Promise<ProjectFormStepperHarness> {
		const fixture = TestBed.createComponent(ProjectFormStepperComponent);
		fixture.componentRef.setInput('active', active);
		fixture.componentRef.setInput('label', 'Create a project');
		fixture.componentRef.setInput('options', []);
		fixture.componentRef.setInput('withInvitation', withInvitation);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ProjectFormStepperHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it.each([
		{ name: 'the first step of an edition', active: 1, withInvitation: false, completed: [false, false] },
		{ name: 'the options of a creation', active: 2, withInvitation: true, completed: [true, false, false] },
		{ name: 'the invitations after a creation', active: 3, withInvitation: true, completed: [true, true, false] },
	])('marks $name', async ({ active, withInvitation, completed }) => {
		// Arrange
		const harness = await create(active, withInvitation);

		// Act
		const steps = await harness.steps();

		// Assert
		expect([await harness.active(), await harness.label(), steps.map((step) => step.completed)]).toEqual([
			`step-${active}`,
			'Create a project',
			completed,
		]);
	});
});

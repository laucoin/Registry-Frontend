import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { createProjectForm, toProjectFormModel } from '@pages/projects/project-form/project.form';
import { ProjectInformationFieldsComponent } from '@pages/projects/project-form/project-information-fields/project-information-fields.component';
import { ProjectInformationFieldsHarness } from '@pages/projects/project-form/project-information-fields/testing/project-information-fields.harness';

@Component({
	imports: [ProjectInformationFieldsComponent],
	template: '<app-project-information-fields [form]="form" />',
})
class HostComponent {
	public readonly model = signal(toProjectFormModel());
	public readonly form = createProjectForm(this.model);
}

describe('ProjectInformationFieldsComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('binds the name to the project form and offers both dates', async () => {
		// Arrange
		const fixture = TestBed.createComponent(HostComponent);
		const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, ProjectInformationFieldsHarness);

		// Act
		await harness.typeName('Camp');

		// Assert
		expect([fixture.componentInstance.model().name, await harness.datesShown()]).toEqual(['Camp', 2]);
	});
});

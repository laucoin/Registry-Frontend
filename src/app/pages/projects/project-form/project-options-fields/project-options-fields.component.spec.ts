import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { createProjectOptionsForm, ProjectOptionsFormModel } from '@pages/projects/project-form/project.form';
import { ProjectOptionsFieldsComponent } from '@pages/projects/project-form/project-options-fields/project-options-fields.component';
import {
	OptionsSelectionEnum,
	ProjectOptionsFieldsHarness,
} from '@pages/projects/project-form/project-options-fields/testing/project-options-fields.harness';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';

const OPTIONS: ProjectOptionModel[] = [
	{ value: ProjectOptionEnum.ACTIVITY, label: 'Activity', ask: 'Activities?', preRequired: [] },
	{
		value: ProjectOptionEnum.ALERT,
		label: 'Alert',
		ask: 'Alerts?',
		preRequired: [{ label: 'Activity', value: ProjectOptionEnum.ACTIVITY }],
	},
];

@Component({
	imports: [ProjectOptionsFieldsComponent],
	template: '<app-project-options-fields [form]="form" [options]="options" [(model)]="model" />',
})
class HostComponent {
	public readonly options = OPTIONS;
	public readonly model = signal<ProjectOptionsFormModel>({ ACTIVITY: false, ALERT: false });
	public readonly form = createProjectOptionsForm(this.model, signal(OPTIONS));
}

describe('ProjectOptionsFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(model: ProjectOptionsFormModel): Promise<ProjectOptionsFieldsHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.model.set(model);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ProjectOptionsFieldsHarness);
	}

	async function selectAll(checked: boolean): Promise<void> {
		const checkbox: HTMLElement & { checked: boolean } = fixture.nativeElement.querySelector(
			'[data-test-id="project-options-fields-select-all-checkbox"]',
		);
		checkbox.checked = checked;
		checkbox.dispatchEvent(new Event('change'));
		await fixture.whenStable();
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							projects: { form: { error: { options: { preRequiredOptions: 'needs {{ missing }}' } } } },
						},
					},
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
		});
	});

	it.each([
		{ name: 'none', model: { ACTIVITY: false, ALERT: false }, state: OptionsSelectionEnum.NONE },
		{ name: 'some', model: { ACTIVITY: true, ALERT: false }, state: OptionsSelectionEnum.SOME },
		{ name: 'all', model: { ACTIVITY: true, ALERT: true }, state: OptionsSelectionEnum.ALL },
	])('marks the select-all box when $name of the options are chosen', async ({ model, state }) => {
		// Arrange
		const harness = await create(model);

		// Act
		const shown = await harness.allState();

		// Assert
		expect(shown).toBe(state);
	});

	it.each([
		{ name: 'chooses every option', checked: true, expected: { ACTIVITY: true, ALERT: true } },
		{ name: 'clears every option', checked: false, expected: { ACTIVITY: false, ALERT: false } },
	])('$name from the select-all box', async ({ checked, expected }) => {
		// Arrange
		await create({ ACTIVITY: true, ALERT: false });

		// Act
		await selectAll(checked);

		// Assert
		expect(fixture.componentInstance.model()).toEqual(expected);
	});

	it('lists the options and flags the one whose prerequisite is missing', async () => {
		// Arrange
		const harness = await create({ ACTIVITY: false, ALERT: true });

		// Act
		const options = await harness.options();

		// Assert
		expect(options.map(({ label, checked, error }) => [label, checked, error !== null])).toEqual([
			['Activities? (Activity)', false, false],
			['Alerts? (Alert)', true, true],
		]);
	});
});

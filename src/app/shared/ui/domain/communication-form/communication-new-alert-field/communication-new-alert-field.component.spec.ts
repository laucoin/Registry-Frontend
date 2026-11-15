import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { CommunicationNewAlertFieldComponent } from '@shared/ui/domain/communication-form/communication-new-alert-field/communication-new-alert-field.component';
import { CommunicationNewAlertFieldHarness } from '@shared/ui/domain/communication-form/communication-new-alert-field/testing/communication-new-alert-field.harness';

import '@sgdf/ui/input';

@Component({
	imports: [CommunicationNewAlertFieldComponent],
	template:
		'<app-communication-new-alert-field [field]="tree" (submitted)="submits = submits + 1" (removed)="removes = removes + 1" />',
})
class HostComponent {
	public readonly title = signal('');
	public readonly tree = form(this.title, (path) => required(path));
	public submits = 0;
	public removes = 0;
}

describe('CommunicationNewAlertFieldComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	async function create(): Promise<{ host: HostComponent; harness: CommunicationNewAlertFieldHarness }> {
		const fixture = TestBed.createComponent(HostComponent);
		const harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(CommunicationNewAlertFieldHarness);
		return { host: fixture.componentInstance, harness };
	}

	it('writes the typed title to the form and submits on Enter', async () => {
		// Arrange
		const { host, harness } = await create();

		// Act
		await harness.type('Fire');
		await harness.pressEnter();

		// Assert
		expect([host.title(), host.submits]).toEqual(['Fire', 1]);
	});

	it('asks to remove the field', async () => {
		// Arrange
		const { host, harness } = await create();

		// Act
		await harness.remove();

		// Assert
		expect(host.removes).toBe(1);
	});

	it('shows the error of a touched empty title', async () => {
		// Arrange
		const { host, harness } = await create();

		// Act
		host.tree().markAsTouched();

		// Assert
		expect(await harness.error()).toBe('fr.alerts.form.error.title.required');
	});
});

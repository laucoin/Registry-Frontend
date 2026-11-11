import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import {
	ActiveAlertCardComponent,
	AlertCard,
} from '@pages/projects/[projectId]/widgets/project-active-alert/active-alert-card/active-alert-card.component';
import { ActiveAlertCardHarness } from '@pages/projects/[projectId]/widgets/project-active-alert/active-alert-card/testing/active-alert-card.harness';
import { DateHelper } from '@shared/helpers/date.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { AlertModel } from '@shared/models/model/alert.model';

const AGE = DateHelper.buildDateInterval(new Date('2026-01-01T08:00:00Z'), new Date('2026-01-01T10:00:00Z'));

const ALERT = {
	id: 'a1',
	title: 'Fire',
	dateTime: new Date('2026-01-01T10:00:00Z'),
	criticality: { label: 'Urgent', value: 'URGENT' },
	lastCommunication: { dateTime: new Date('2026-01-01T11:00:00Z'), message: 'On site' },
} as unknown as AlertModel;

@Component({
	imports: [ActiveAlertCardComponent],
	template:
		'<app-active-alert-card [card]="card()" [canCommunicate]="canCommunicate()" (communicate)="communications = communications + 1" />',
})
class HostComponent {
	public readonly card = signal<AlertCard>({ alert: ALERT, variant: 'danger', age: undefined });
	public readonly canCommunicate = signal(true);
	public communications = 0;
}

describe('ActiveAlertCardComponent', () => {
	let host: HostComponent;

	async function create(
		card: Partial<AlertCard>,
		alert: Partial<AlertModel> = {},
		canCommunicate = true,
	): Promise<ActiveAlertCardHarness> {
		const fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
		host.card.update((current) => ({ ...current, ...card, alert: { ...current.alert, ...alert } }));
		host.canCommunicate.set(canCommunicate);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ActiveAlertCardHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							projectHome: {
								activeAlert: { untitled: 'Untitled', lastCommunication: 'Last {{ date }}' },
							},
						},
					},
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [{ provide: DatePipe, useValue: { transform: (): string => 'date' } }, PluralTranslationPipe],
		});
	});

	it.each([
		{
			name: 'a titled alert with its criticality, age and last message',
			card: { age: AGE },
			alert: {},
			expected: { title: 'Fire', untitled: false, variant: 'danger', lastCommunication: 'Last date · On site' },
		},
		{
			name: 'an untitled alert without criticality nor communication',
			card: { variant: 'info' as const },
			alert: { title: ' ', criticality: undefined, lastCommunication: undefined },
			expected: { title: 'Untitled', untitled: true, variant: 'info', lastCommunication: undefined },
		},
		{
			name: 'a communication without message',
			card: {},
			alert: { lastCommunication: { dateTime: new Date(), message: undefined } },
			expected: { title: 'Fire', untitled: false, variant: 'danger', lastCommunication: 'Last date' },
		},
	])('shows $name', async ({ card, alert, expected }) => {
		// Arrange
		const harness = await create(card, alert as Partial<AlertModel>);

		// Act
		const view = await harness.view();

		// Assert
		expect(view).toEqual(expect.objectContaining(expected));
	});

	it.each([
		{
			name: 'criticality and age',
			card: { age: AGE },
			alert: {},
			starts: 'Urgent ·',
		},
		{
			name: 'age only',
			card: { age: AGE },
			alert: { criticality: undefined },
			starts: '',
		},
		{ name: 'criticality only', card: { age: undefined }, alert: {}, starts: 'Urgent' },
	])('writes the $name of the alert', async ({ card, alert, starts }) => {
		// Arrange
		const harness = await create(card, alert as Partial<AlertModel>);

		// Act
		const age = (await harness.view()).age;

		// Assert
		expect(age.startsWith(starts)).toBe(true);
	});

	it.each([
		{ name: 'offers to communicate on the alert', canCommunicate: true, expected: [true, 1] },
		{ name: 'offers nothing without the communication option', canCommunicate: false, expected: [false, 0] },
	])('$name', async ({ canCommunicate, expected }) => {
		// Arrange
		const harness = await create({}, {}, canCommunicate);
		const shown = (await harness.view()).canCommunicate;

		// Act
		await harness.communicate();

		// Assert
		expect([shown, host.communications]).toEqual(expected);
	});
});

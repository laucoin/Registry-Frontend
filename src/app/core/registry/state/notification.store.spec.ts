import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { NotificationStore } from '@core/registry/state/notification.store';
import { defined } from '@shared/helpers/testing/defined';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ConfirmationModel } from '@shared/models/model/confirmation.model';
import { NotificationModel } from '@shared/models/model/notification.model';

describe('NotificationStore', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [{ provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } }],
		});
	});

	it('delivers every notification to a listener, even several in a row', () => {
		// Arrange
		const store = TestBed.inject(NotificationStore);
		const received: string[] = [];
		store.messages$().subscribe((message) => received.push(defined(message.summary)));

		// Act
		store.notify({ summary: 'first' });
		store.notify({ summary: 'second' });

		// Assert
		expect(received).toEqual(['first', 'second']);
	});

	it('does not replay past notifications to a late listener', () => {
		// Arrange
		const store = TestBed.inject(NotificationStore);
		store.notify({ summary: 'missed' });
		const received: string[] = [];

		// Act
		store.messages$().subscribe((message) => received.push(defined(message.summary)));

		// Assert
		expect(received).toEqual([]);
	});

	it('fills a notification that has neither summary nor detail with the unknown error title and detail', () => {
		// Arrange
		const store = TestBed.inject(NotificationStore);
		const received: NotificationModel[] = [];
		store.messages$().subscribe((message) => received.push(message));

		// Act
		store.notify({ severity: 'error', summary: ' ', detail: '' });

		// Assert
		expect(received[0].summary).toBe('t:global.notifications.UNKNOWN_ERROR.title');
		expect(received[0].detail).toBe('t:global.notifications.UNKNOWN_ERROR.message');
	});

	it('forwards a normal notification untouched', () => {
		// Arrange
		const store = TestBed.inject(NotificationStore);
		const received: NotificationModel[] = [];
		store.messages$().subscribe((message) => received.push(message));
		const message: NotificationModel = { severity: 'success', summary: 'Done', detail: 'ok' };

		// Act
		store.notify(message);

		// Assert
		expect(received).toEqual([message]);
	});

	it('delivers every confirmation request to its listener', () => {
		// Arrange
		const store = TestBed.inject(NotificationStore);
		const received: ConfirmationModel[] = [];
		const confirmation: ConfirmationModel = {
			header: 'h',
			message: 'm',
			acceptSeverity: SeverityEnum.DANGER,
			accept: (): void => undefined,
		};
		store.confirmations$().subscribe((it) => received.push(it));

		// Act
		store.confirm(confirmation);

		// Assert
		expect(received).toEqual([confirmation]);
	});
});

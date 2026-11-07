import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { beforeEach, describe, expect, it } from 'vitest';

import { defined } from '@shared/helpers/testing/defined';
import { NotificationModel } from '@shared/models/model/notification.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

@Component({
	imports: [SectionErrorComponent],
	templateUrl: './section-error.component.spec.html',
})
class HostComponent {
	public readonly error: WritableSignal<NotificationModel> = signal({ summary: 'Oops', detail: 'Backend said no' });
	public readonly retrying = signal(false);
	public readonly retryable = signal(true);
	public retries = 0;
}

describe('SectionErrorComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let host: HostComponent;

	const render = async (): Promise<void> => {
		fixture.detectChanges();
		await fixture.whenStable();
	};
	const query = (selector: string): HTMLElement | null => fixture.nativeElement.querySelector(selector);
	const calloutTitle = (): string | undefined =>
		(query('sgdf-callout') as (HTMLElement & { title?: string }) | null)?.title;

	beforeEach(async () => {
		await MockBuilder(HostComponent)
			.keep(SectionErrorComponent)
			.mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
	});

	it('shows the title and the backend message of the failure', async () => {
		// Arrange
		host.error.set({ summary: 'Oops', detail: 'Backend said no' });

		// Act
		await render();

		// Assert
		expect(calloutTitle()).toBe('Oops');
		expect(query('sgdf-callout')?.textContent).toContain('Backend said no');
	});

	it('falls back on the unknown error texts when the failure has no message', async () => {
		// Arrange
		host.error.set({});

		// Act
		await render();

		// Assert
		expect(calloutTitle()).toBe('global.notifications.UNKNOWN_ERROR.title');
		expect(query('sgdf-callout')?.textContent).toContain('global.notifications.UNKNOWN_ERROR.message');
	});

	it('emits a retry when the button is clicked', async () => {
		// Arrange
		await render();

		// Act
		defined(query('sgdf-button')).click();

		// Assert
		expect(host.retries).toBe(1);
	});

	it('hides the retry button when the failure cannot be retried', async () => {
		// Arrange
		host.retryable.set(false);

		// Act
		await render();

		// Assert
		expect(query('sgdf-button')).toBeNull();
	});

	it('flags the button as loading while the retry is in flight', async () => {
		// Arrange
		host.retrying.set(true);

		// Act
		await render();

		// Assert
		expect((query('sgdf-button') as HTMLElement & { loading?: boolean }).loading).toBe(true);
	});
});

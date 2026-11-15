import { Location } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { GenericModel } from '@shared/models/model/generic.model';
import { BaseElementFormComponent } from '@shared/ui/base/base-element-form.component';

interface NameModel {
	name: string;
}

class TestElementForm extends BaseElementFormComponent<GenericModel, NameModel> {
	protected readonly idParamName: string = 'elementId';
	protected readonly model = signal<NameModel>({ name: '' });
	protected readonly form = form(this.model);

	constructor() {
		super();
	}

	public formatted(date: CustomDatetimeModel): string | undefined {
		return this.dateContext.formatDate(date);
	}

	protected fetchElement(): Observable<GenericModel> {
		return of({ id: 'e1' } as GenericModel);
	}

	protected toFormModel(): NameModel {
		return { name: 'loaded' };
	}

	protected create(): Observable<unknown> {
		return of(undefined);
	}

	protected update(): Observable<unknown> {
		return of(undefined);
	}
}

describe('BaseElementFormComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				{ provide: Location, useValue: { back: vi.fn() } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
				{ provide: SessionFacade, useValue: autoMock() },
				{ provide: UiFacade, useValue: autoMock() },
				{
					provide: CustomDateFormatPipe,
					useValue: { transform: (value: CustomDatetimeModel): string => `formatted ${value.date}` },
				},
				{ provide: TranslocoService, useValue: { translate: (key: string): string => key } },
			],
		});
	});

	it('formats the dates of the project rules with the date pipe', () => {
		// Arrange
		const page = TestBed.runInInjectionContext(() => new TestElementForm());

		// Act
		const formatted = page.formatted({ date: '2026-07-01', time: undefined });

		// Assert
		expect(formatted).toBe('formatted 2026-07-01');
	});
});

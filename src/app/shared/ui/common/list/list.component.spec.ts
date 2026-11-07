import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { beforeEach, describe, expect, it } from 'vitest';

import { UiFacade } from '@core/registry/state/ui.facade';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { defined } from '@shared/helpers/testing/defined';
import { GenericModel } from '@shared/models/model/generic.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { LoadMoreComponent } from '@shared/ui/common/load-more/load-more.component';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { SkeletonListComponent } from '@shared/ui/common/skeleton-list/skeleton-list.component';

@Component({
	imports: [ListComponent, RegistryTemplateDirective],
	templateUrl: './list.component.spec.html',
})
class HostComponent {
	public readonly page: WritableSignal<PageModel<GenericModel> | undefined> = signal(undefined);
	public readonly loading = signal(false);
	public readonly error: WritableSignal<NotificationModel | undefined> = signal(undefined);
	public readonly loadingMore = signal(false);
	public readonly filters = signal(0);
	public readonly withEmpty = signal(true);
	public events: PageEventModel[] = [];
	public resets = 0;
}

const pageOf = (ids: string[], page: number, totalElements: number): PageModel<GenericModel> => ({
	page,
	size: 2,
	totalElements,
	totalPages: Math.ceil(totalElements / 2),
	hasNext: page + 1 < Math.ceil(totalElements / 2),
	content: ids.map((id) => ({ id }) as GenericModel),
	lastRefresh: new Date(),
});

describe('ListComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let host: HostComponent;
	let tinyScreen: WritableSignal<boolean>;

	const render = async (): Promise<void> => {
		fixture.detectChanges();
		await fixture.whenStable();
	};
	const query = (selector: string): HTMLElement | null => fixture.nativeElement.querySelector(selector);
	const queryAll = (selector: string): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll(selector));
	const button = (): HTMLElement => defined(query('sgdf-button'));
	const calloutTitle = (): string | undefined =>
		(query('sgdf-callout') as (HTMLElement & { title?: string }) | null)?.title;

	beforeEach(async () => {
		tinyScreen = signal(false);
		await MockBuilder(HostComponent)
			.keep(ListComponent)
			.keep(RegistryTemplateDirective)
			.keep(SectionErrorComponent)
			.keep(LoadMoreComponent)
			.keep(SkeletonListComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(DateFormatPipe, () => 'date')
			.provide({ provide: UiFacade, useValue: { tinyScreen } });
		fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
	});

	it('shows skeleton rows while the first batch loads', async () => {
		// Arrange
		host.loading.set(true);

		// Act
		await render();

		// Assert
		expect(queryAll('sgdf-list sgdf-list-item')).toHaveLength(6);
		expect(queryAll('.item')).toHaveLength(0);
	});

	it('renders every element of the page with the element template', async () => {
		// Arrange
		host.page.set(pageOf(['a', 'b'], 0, 2));

		// Act
		await render();

		// Assert
		expect(queryAll('.item').map((it): string | null => it.textContent)).toEqual(['a', 'b']);
	});

	it('shows the search template in the search area', async () => {
		// Arrange
		host.page.set(pageOf(['a'], 0, 1));

		// Act
		await render();

		// Assert
		expect(query('sgdf-accordion-item .search-slot')).not.toBeNull();
	});

	it.each([
		['wide', false, true],
		['tiny', true, false],
	])('opens the search area by default only on a %s screen', async (_label, tiny, expanded) => {
		// Arrange
		tinyScreen.set(tiny);
		host.page.set(pageOf(['a'], 0, 1));

		// Act
		await render();

		// Assert
		expect((query('sgdf-accordion-item') as HTMLElement & { expanded: boolean }).expanded).toBe(expanded);
	});

	it('shows the custom empty template when there is no element and no filter', async () => {
		// Arrange
		host.page.set(pageOf([], 0, 0));

		// Act
		await render();

		// Assert
		expect(query('.custom-empty')).not.toBeNull();
	});

	it('falls back on a neutral callout when the page gives no empty template', async () => {
		// Arrange
		host.withEmpty.set(false);
		host.page.set(pageOf([], 0, 0));

		// Act
		await render();

		// Assert
		expect(calloutTitle()).toBe('global.notifications.EMPTY.title');
	});

	it('tells that no element matches the filters and lets the page reset them', async () => {
		// Arrange
		host.page.set(pageOf([], 0, 0));
		host.filters.set(2);
		await render();

		// Act
		button().click();

		// Assert
		expect(query('.custom-empty')).toBeNull();
		expect(calloutTitle()).toBe('global.list.no-result.title');
		expect(host.resets).toBe(1);
	});

	it('shows the failure with its cause and keeps the shown elements', async () => {
		// Arrange
		host.page.set(pageOf(['a', 'b'], 0, 4));
		host.error.set({ summary: 'Oops', detail: 'Backend said no' });

		// Act
		await render();

		// Assert
		expect(calloutTitle()).toBe('Oops');
		expect(query('sgdf-callout')?.textContent).toContain('Backend said no');
		expect(queryAll('.item')).toHaveLength(2);
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

	it('retries the first batch when nothing could be loaded', async () => {
		// Arrange
		host.error.set({ summary: 'Oops', detail: 'No' });
		await render();

		// Act
		button().click();

		// Assert
		expect(host.events).toEqual([{ page: 0, size: 20 }]);
	});

	it('retries the batch that failed after the shown ones', async () => {
		// Arrange
		host.page.set(pageOf(['a', 'b'], 0, 6));
		host.error.set({ summary: 'Oops', detail: 'No' });
		await render();

		// Act
		queryAll('sgdf-callout sgdf-button')[0].click();

		// Assert
		expect(host.events).toEqual([{ page: 1, size: 2 }]);
	});

	it('asks for the next batch when "load more" is clicked while batches remain', async () => {
		// Arrange
		host.page.set(pageOf(['a', 'b'], 0, 5));
		await render();

		// Act
		defined(queryAll('sgdf-button').at(-1)).click();

		// Assert
		expect(host.events).toEqual([{ page: 1, size: 2 }]);
	});

	it('hides "load more" on the last batch', async () => {
		// Arrange
		host.page.set(pageOf(['e'], 2, 5));

		// Act
		await render();

		// Assert
		expect(query('sgdf-button')).toBeNull();
	});
});

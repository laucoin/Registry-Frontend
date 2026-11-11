import { ComponentHarness } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { UiFacade } from '@core/registry/state/ui.facade';
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive';
import { defined } from '@shared/helpers/testing/defined';
import { GenericModel } from '@shared/models/model/generic.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

@Component({
	selector: 'app-list-host',
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
	public readonly label: WritableSignal<string | undefined> = signal(undefined);
	public events: PageEventModel[] = [];
	public resets = 0;
}

class HostHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-list-host';

	private readonly items = this.locatorForAll('.item');
	private readonly customEmpty = this.locatorForOptional('.custom-empty');
	private readonly searchSlot = this.locatorForOptional('.search-slot');

	public async itemTexts(): Promise<string[]> {
		return Promise.all((await this.items()).map((item) => item.text()));
	}

	public async customEmptyShown(): Promise<boolean> {
		return (await this.customEmpty()) !== null;
	}

	public async searchShown(): Promise<boolean> {
		return (await this.searchSlot()) !== null;
	}
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

	async function harnesses(): Promise<{ list: ListHarness; page: HostHarness }> {
		const page = await TestbedHarnessEnvironment.harnessForFixture(fixture, HostHarness);
		return { list: await TestbedHarnessEnvironment.loader(fixture).getHarness(ListHarness), page };
	}

	beforeEach(() => {
		tinyScreen = signal(false);
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: UiFacade, useValue: { tinyScreen } },
			],
		});
		fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
	});

	it('shows skeleton rows while the first batch loads', async () => {
		// Arrange
		host.loading.set(true);

		// Act
		const { list, page } = await harnesses();

		// Assert
		expect(await defined(await list.skeleton()).rowCount()).toBe(6);
		expect(await page.itemTexts()).toEqual([]);
	});

	it('renders every element of the page with the element template, under the date of the last refresh', async () => {
		// Arrange
		host.page.set(pageOf(['a', 'b'], 0, 2));

		// Act
		const { list, page } = await harnesses();

		// Assert
		expect(await page.itemTexts()).toEqual(['a', 'b']);
		expect(await list.lastRefreshText()).toBe('fr.global.date-and-time-format.last-refresh');
	});

	it.each([
		{
			name: 'names the list after the empty message prefix by default',
			label: undefined,
			expected: 'fr.global.notifications.EMPTY.title',
		},
		{ name: 'names the list with the label given by the page', label: 'Users', expected: 'Users' },
	])('$name', async ({ label, expected }) => {
		// Arrange
		host.label.set(label);
		host.page.set(pageOf(['a'], 0, 1));

		// Act
		const { list } = await harnesses();

		// Assert
		expect(await list.listLabel()).toBe(expected);
	});

	it('shows the search template in the search area, with the count of active filters', async () => {
		// Arrange
		host.page.set(pageOf(['a'], 0, 1));
		host.filters.set(2);

		// Act
		const { list, page } = await harnesses();

		// Assert
		expect(await page.searchShown()).toBe(true);
		expect(await list.activeFiltersText()).toBe('fr.global.list.active-filters');
	});

	it.each([
		{ name: 'wide', tiny: false, expanded: true },
		{ name: 'tiny', tiny: true, expanded: false },
	])('opens the search area by default only on a $name screen', async ({ tiny, expanded }) => {
		// Arrange
		tinyScreen.set(tiny);
		host.page.set(pageOf(['a'], 0, 1));

		// Act
		const { list } = await harnesses();

		// Assert
		expect(await list.searchExpanded()).toBe(expanded);
	});

	it('shows the custom empty template when there is no element and no filter', async () => {
		// Arrange
		host.page.set(pageOf([], 0, 0));

		// Act
		const { page } = await harnesses();

		// Assert
		expect(await page.customEmptyShown()).toBe(true);
	});

	it('falls back on a neutral callout when the page gives no empty template', async () => {
		// Arrange
		host.withEmpty.set(false);
		host.page.set(pageOf([], 0, 0));

		// Act
		const { list } = await harnesses();

		// Assert
		expect(await list.emptyTitle()).toBe('fr.global.notifications.EMPTY.title');
	});

	it('tells that no element matches the filters and lets the page reset them', async () => {
		// Arrange
		host.page.set(pageOf([], 0, 0));
		host.filters.set(2);
		const { list, page } = await harnesses();

		// Act
		await list.resetFilters();

		// Assert
		expect(await page.customEmptyShown()).toBe(false);
		expect(await list.noResultTitle()).toBe('fr.global.list.no-result.title');
		expect(host.resets).toBe(1);
	});

	it('shows the failure and keeps the shown elements', async () => {
		// Arrange
		host.page.set(pageOf(['a', 'b'], 0, 4));
		host.error.set({ summary: 'Oops', detail: 'Backend said no' });

		// Act
		const { list, page } = await harnesses();

		// Assert
		expect(await defined(await list.error()).title()).toBe('Oops');
		expect(await page.itemTexts()).toEqual(['a', 'b']);
	});

	it('shows no empty callout when the first batch failed', async () => {
		// Arrange
		host.withEmpty.set(false);
		host.page.set(pageOf([], 0, 0));
		host.error.set({ summary: 'Oops' });

		// Act
		const { list } = await harnesses();

		// Assert
		expect(await list.emptyTitle()).toBeUndefined();
	});

	it.each([
		{
			name: 'retries the first batch when nothing could be loaded',
			page: undefined,
			expected: { page: 0, size: 20 },
		},
		{
			name: 'retries the batch that failed after the shown ones',
			page: pageOf(['a', 'b'], 0, 6),
			expected: { page: 1, size: 2 },
		},
	])('$name', async ({ page, expected }) => {
		// Arrange
		host.page.set(page);
		host.error.set({ summary: 'Oops', detail: 'No' });
		const { list } = await harnesses();

		// Act
		await defined(await list.error()).retry();

		// Assert
		expect(host.events).toEqual([expected]);
	});

	it('asks for the next batch when "load more" is clicked while batches remain', async () => {
		// Arrange
		host.page.set(pageOf(['a', 'b'], 0, 5));
		const { list } = await harnesses();

		// Act
		await defined(await list.loadMore()).loadMore();

		// Assert
		expect(host.events).toEqual([{ page: 1, size: 2 }]);
	});

	it('hides "load more" on the last batch', async () => {
		// Arrange
		host.page.set(pageOf(['e'], 2, 5));

		// Act
		const { list } = await harnesses();

		// Assert
		expect(await list.loadMore()).toBeNull();
	});
});

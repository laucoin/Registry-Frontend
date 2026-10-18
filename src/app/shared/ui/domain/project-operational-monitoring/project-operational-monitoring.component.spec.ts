import { DebugElement, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { NotificationModel } from '@shared/models/model/notification.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { PageModel } from '@shared/models/model/page.model';
import { ProjectOperationalMonitoringComponent } from './project-operational-monitoring.component';

const page: PageModel<MovementModel> = { page: 0, size: 10, totalElements: 6, totalPages: 1, hasNext: false, content: [], lastRefresh: new Date() };

describe('ProjectOperationalMonitoringComponent', () => {
	let fixture: ComponentFixture<ProjectOperationalMonitoringComponent>;
	let facade: Record<string, unknown>;
	let fetchWithActivity: ReturnType<typeof vi.fn>;
	let fetchWithoutActivity: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		fetchWithActivity = vi.fn();
		fetchWithoutActivity = vi.fn();
		facade = {
			currentMovementsPageWithActivity: signal(page),
			currentMovementsPageWithActivityLoading: signal(false),
			currentMovementsPageWithActivitySilentLoading: signal(false),
			currentMovementsPageWithActivityError: signal(undefined),
			fetchCurrentMovementsPageWithActivity: fetchWithActivity,
			currentMovementsPageWithoutActivity: signal(undefined),
			currentMovementsPageWithoutActivityLoading: signal(false),
			currentMovementsPageWithoutActivitySilentLoading: signal(false),
			currentMovementsPageWithoutActivityError: signal(undefined),
			fetchCurrentMovementsPageWithoutActivity: fetchWithoutActivity,
		};
		await MockBuilder(ProjectOperationalMonitoringComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: SelectedProjectFacade, useValue: facade });
		fixture = TestBed.createComponent(ProjectOperationalMonitoringComponent);
		await fixture.whenStable();
	});

	function showTab(name: string): void {
		fixture.nativeElement.querySelector('sgdf-tab-group').dispatchEvent(new CustomEvent<{ name: string }>('sgdf-tab-show', { detail: { name } }));
	}

	it('should display the activities and the other movements tabs only', () => {
		// Arrange
		const selector: string = 'sgdf-tab';

		// Act
		const count: number = fixture.nativeElement.querySelectorAll(selector).length;

		// Assert
		expect(count).toBe(2);
	});

	it('should load the first batch of the activities at once, capped to ten', () => {
		// Arrange
		const expected: unknown[] = [undefined, 10];

		// Act
		const requested: unknown[] = fetchWithActivity.mock.calls[0];

		// Assert
		expect(requested).toEqual(expected);
		expect(fetchWithoutActivity).not.toHaveBeenCalled();
	});

	it('should load the other movements only when their tab is first shown', () => {
		// Arrange
		showTab('otherMovements');

		// Act
		showTab('otherMovements');

		// Assert
		expect(fetchWithoutActivity).toHaveBeenCalledTimes(1);
		expect(fetchWithoutActivity).toHaveBeenCalledWith(undefined, 10);
	});

	it('should ignore the display of an unknown tab', () => {
		// Arrange
		const event: CustomEvent<{ name: string }> = new CustomEvent<{ name: string }>('sgdf-tab-show', { detail: { name: 'unknown' } });

		// Act
		fixture.nativeElement.querySelector('sgdf-tab-group').dispatchEvent(event);

		// Assert
		expect(fetchWithoutActivity).not.toHaveBeenCalled();
	});

	it('should display the total of a loaded tab in its badge and none for a tab not loaded', () => {
		// Arrange
		const badges: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-badge'));

		// Act
		const texts: string[] = badges.map((badge: HTMLElement): string => badge.textContent.trim());

		// Assert
		expect(texts).toEqual(['6']);
	});

	it('should render the list of a tab only once it was shown', async () => {
		// Arrange
		const before: number = fixture.nativeElement.querySelectorAll('app-list').length;

		// Act
		showTab('otherMovements');
		await fixture.whenStable();
		const after: number = fixture.nativeElement.querySelectorAll('app-list').length;

		// Assert
		expect(before).toBe(1);
		expect(after).toBe(2);
	});

	it('should fetch the requested batch of the list of a tab', () => {
		// Arrange
		const request: { page: number, size: number } = { page: 1, size: 10 };

		// Act
		ngMocks.output('app-list', 'updateRequired').emit(request);

		// Assert
		expect(fetchWithActivity).toHaveBeenLastCalledWith(1, 10);
	});

	it('should hand the state of each list to its own tab', async () => {
		// Arrange
		const error: NotificationModel = { severity: 'error', detail: 'boom' } as NotificationModel;
		(facade['currentMovementsPageWithActivityError'] as WritableSignal<NotificationModel | undefined>).set(error);
		(facade['currentMovementsPageWithActivityLoading'] as WritableSignal<boolean>).set(true);

		// Act
		await fixture.whenStable();

		// Assert
		expect(ngMocks.input('app-list', 'error')).toBe(error);
		expect(ngMocks.input('app-list', 'loading')).toBe(true);
	});

	it('should fetch the batch of the other movements when their list asks for one', async () => {
		// Arrange
		showTab('otherMovements');
		await fixture.whenStable();
		const lists: DebugElement[] = ngMocks.findAll('app-list');

		// Act
		ngMocks.output(lists[1]!, 'updateRequired').emit({ page: 1, size: 10 });

		// Assert
		expect(fetchWithoutActivity).toHaveBeenLastCalledWith(1, 10);
		expect(fetchWithActivity).toHaveBeenCalledTimes(1);
	});

	it('should name each list after its tab', () => {
		// Arrange
		const selector: string = 'app-list';

		// Act
		const label: string = ngMocks.input(selector, 'label');

		// Assert
		expect(label).toBe('projectHome.operationalMonitoring.tabs.activities');
	});
});

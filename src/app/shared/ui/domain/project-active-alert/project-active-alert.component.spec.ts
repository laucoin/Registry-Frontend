import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { ALERT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500, pageOf } from '@shared/helpers/testing/test-fixtures';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { AlertMapper } from '@shared/mappers/alert.mapper';
import { AlertModel } from '@shared/models/model/alert.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { ProjectActiveAlertComponent } from './project-active-alert.component';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';

function alert(id: string, criticality: string | undefined, withCommunication: boolean = true): AlertModel {
	return {
		...AlertMapper.toModel(ALERT_DTO),
		id,
		title: `Alert ${id}`,
		criticality: criticality ? { label: criticality, value: criticality as never } : undefined,
		lastCommunication: withCommunication ? { dateTime: new Date(), message: 'On site' } : undefined,
	};
}

describe('ProjectActiveAlertComponent', () => {
	let fixture: ComponentFixture<ProjectActiveAlertComponent>;
	let page: WritableSignal<PageModel<AlertModel> | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let communicationEnabled: WritableSignal<boolean>;
	let fetchCurrentAlertsPage: ReturnType<typeof vi.fn>;

	async function render(): Promise<void> {
		fixture = TestBed.createComponent(ProjectActiveAlertComponent);
		await fixture.whenStable();
	}

	function variants(): string[] {
		return Array.from<{ variant: string }>(fixture.nativeElement.querySelectorAll('sgdf-callout')).map((callout: { variant: string }): string => callout.variant);
	}

	beforeEach(async () => {
		page = signal<PageModel<AlertModel> | undefined>(undefined);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		communicationEnabled = signal(true);
		fetchCurrentAlertsPage = vi.fn();
		await MockBuilder(ProjectActiveAlertComponent).provide(REFRESH_SERVICE_STUB)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(PluralTranslationPipe, (key: string): string => key)
			.mock(DateFormatPipe, (): string => 'date')
			.mock(IntervalPipe, (): string => '2 h')
			.provide(provideRouter([]))
			.provide({
				provide: SelectedProjectFacade,
				useValue: { currentAlertsPage: page, currentAlertsPageLoading: loading, currentAlertsPageError: error, fetchCurrentAlertsPage },
			})
			.provide({ provide: AlertFacade, useValue: { alertCriticalityRule: signal('Aging rule') } })
			.provide({ provide: UiFacade, useValue: { tinyScreen: signal(false) } })
			.provide({ provide: SessionFacade, useValue: { selectedProjectHasOption: () => communicationEnabled, currentProjectId: signal('p1') } });
	});

	it('should load the first open alerts when displayed', async () => {
		// Arrange
		page.set(pageOf<AlertModel>([]));

		// Act
		await render();

		// Assert
		expect(fetchCurrentAlertsPage).toHaveBeenCalledWith(0, 6);
	});

	it('should color each alert by its criticality', async () => {
		// Arrange
		page.set(pageOf([alert('a1', 'HIGH'), alert('a2', 'REINFORCED'), alert('a3', 'RECENT'), alert('a4', undefined)]));

		// Act
		await render();

		// Assert
		expect(variants()).toEqual(['danger', 'warning', 'info', 'info']);
	});

	it('should show the rule giving the criticality of an alert and the total of open alerts', async () => {
		// Arrange
		page.set({ ...pageOf([alert('a1', 'HIGH')]), totalElements: 9 });

		// Act
		await render();
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('Aging rule');
		expect(fixture.nativeElement.querySelector('sgdf-tag').textContent.trim()).toBe('projectHome.activeAlert.total');
	});

	it('should offer to see the alerts that are not shown', async () => {
		// Arrange
		page.set({ ...pageOf([alert('a1', 'HIGH')]), totalElements: 4 });

		// Act
		await render();
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('projectHome.activeAlert.seeRemaining');
	});

	it('should say there is no open alert', async () => {
		// Arrange
		page.set(pageOf<AlertModel>([]));

		// Act
		await render();
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('projectHome.activeAlert.empty');
		expect(variants()).toEqual([]);
	});

	it('should display skeleton cards while the alerts load', async () => {
		// Arrange
		loading.set(true);

		// Act
		await render();
		const skeletons: number = fixture.nativeElement.querySelectorAll('sgdf-skeleton').length;

		// Assert
		expect(skeletons).toBe(3);
		expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('global.list.loading');
	});

	it('should display the failure and load the alerts again when retrying', async () => {
		// Arrange
		error.set(PageStateHelper.toNotification(ERROR_500));
		await render();

		// Act
		ngMocks.output('app-section-error', 'retry').emit();

		// Assert
		expect(fixture.nativeElement.querySelector('app-section-error')).not.toBeNull();
		expect(fetchCurrentAlertsPage).toHaveBeenCalledTimes(2);
	});

	it('should link to the alerts page of the project', async () => {
		// Arrange
		page.set(pageOf<AlertModel>([]));
		await render();

		// Act
		const target: string = ngMocks.input('[data-testid="alerts-link"]', 'routerLink');

		// Assert
		expect(target).toBe('/projects/p1/alerts');
	});

	it('should hide the communicate action when the project has no communication option', async () => {
		// Arrange
		communicationEnabled.set(false);
		page.set(pageOf([alert('a1', 'HIGH')]));

		// Act
		await render();
		const buttons: number = fixture.nativeElement.querySelectorAll('sgdf-callout sgdf-button').length;

		// Assert
		expect(buttons).toBe(0);
	});

	it('should open the communications of the alert in a drawer and close it when its host is hidden', async () => {
		// Arrange
		page.set(pageOf([alert('a1', 'HIGH')]));
		await render();

		// Act
		fixture.nativeElement.querySelector('sgdf-callout sgdf-button').click();
		await fixture.whenStable();
		const opened: boolean = fixture.nativeElement.querySelector('app-alert-communications-list') !== null;
		fixture.nativeElement.querySelector('sgdf-drawer').dispatchEvent(new CustomEvent('sgdf-hide'));
		await fixture.whenStable();

		// Assert
		expect(opened).toBe(true);
		expect(fixture.nativeElement.querySelector('app-alert-communications-list')).toBeNull();
	});

	it('should keep the drawer open when the hide event comes from an inner element', async () => {
		// Arrange
		page.set(pageOf([alert('a1', 'HIGH')]));
		await render();
		fixture.nativeElement.querySelector('sgdf-callout sgdf-button').click();
		await fixture.whenStable();
		const inner: HTMLElement = fixture.nativeElement.querySelector('app-alert-communications-list');

		// Act
		inner.dispatchEvent(new CustomEvent('sgdf-hide', { bubbles: true }));
		await fixture.whenStable();

		// Assert
		expect(fixture.nativeElement.querySelector('app-alert-communications-list')).not.toBeNull();
	});
});

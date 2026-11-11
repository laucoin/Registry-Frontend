import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ProjectPage } from '@pages/projects/project.page';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';

@Component({ selector: 'app-child', template: 'child page' })
class ChildComponent {}

describe('ProjectPage', () => {
	let reloads: (() => void)[];
	let refreshCurrentProject: Mock<() => void>;

	beforeEach(() => {
		reloads = [];
		refreshCurrentProject = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				provideRouter([{ path: '', component: ChildComponent }]),
				{ provide: SessionFacade, useValue: { refreshCurrentProject } },
				{
					provide: RefreshService,
					useValue: {
						register: (source: { reload: () => void }): (() => void) => {
							reloads.push(source.reload);
							return (): void => undefined;
						},
					},
				},
			],
		});
	});

	it('shows the child page of the projects area', async () => {
		// Arrange
		const fixture = TestBed.createComponent(ProjectPage);
		await TestBed.inject(Router).navigateByUrl('/');

		// Act
		await fixture.whenStable();

		// Assert
		expect(fixture.nativeElement.textContent).toContain('child page');
	});

	it('refreshes the counters of the selected project when the refresh service asks', () => {
		// Arrange
		TestBed.createComponent(ProjectPage);

		// Act
		reloads.forEach((reload) => reload());

		// Assert
		expect(refreshCurrentProject).toHaveBeenCalledTimes(1);
	});
});

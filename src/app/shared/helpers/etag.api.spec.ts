import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { ProjectApi } from '@core/registry/state/project.api';
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api';
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api';
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api';
import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api';
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api';
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api';
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api';

interface UpdateCase {
	name: string;
	api: Type<unknown>;
	method: string;
	url: string;
}

const BACKEND = 'http://backend.test/api/v2';

const CASES: UpdateCase[] = [
	{ name: 'activity', api: ActivityApi, method: 'updateActivityById', url: `${BACKEND}/projects/p1/activities/x1` },
	{ name: 'group', api: GroupApi, method: 'updateGroupById', url: `${BACKEND}/projects/p1/groups/x1` },
	{
		name: 'participant',
		api: ParticipantApi,
		method: 'updateParticipantById',
		url: `${BACKEND}/projects/p1/participants/x1`,
	},
	{
		name: 'project profile',
		api: ProjectProfileApi,
		method: 'updateProjectProfileById',
		url: `${BACKEND}/projects/p1/profiles/x1`,
	},
	{ name: 'vehicle', api: VehicleApi, method: 'updateVehicleById', url: `${BACKEND}/projects/p1/vehicles/x1` },
	{
		name: 'communication',
		api: CommunicationApi,
		method: 'updateCommunicationById',
		url: `${BACKEND}/projects/p1/communications/x1`,
	},
	{ name: 'movement', api: MovementApi, method: 'updateMovementById', url: `${BACKEND}/projects/p1/movements/x1` },
	{
		name: 'guests movement',
		api: MovementApi,
		method: 'updateGuestsMovementById',
		url: `${BACKEND}/projects/p1/movements/guests/x1`,
	},
];

function call(api: unknown, item: UpdateCase, ifMatch: string | undefined): void {
	const update = (api as Record<string, (...args: unknown[]) => Observable<unknown>>)[item.method].bind(api);
	update('p1', 'x1', {}, ifMatch).subscribe();
}

describe('update requests with a precondition', () => {
	let controller: HttpTestingController;

	beforeEach(() => {
		RegistryConfig.environment = {
			production: false,
			backend: { url: 'http://backend.test', noAuthPaths: [] },
			hosting: { providerName: null, providerAddress: null },
		};
		TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
		controller = TestBed.inject(HttpTestingController);
	});

	it.each(CASES)('sends the If-Match of the edited $name', (item: UpdateCase) => {
		// Arrange
		const api: unknown = TestBed.inject(item.api);

		// Act
		call(api, item, '"1791885731123"');
		const request = controller.expectOne(item.url);

		// Assert
		expect(request.request.method).toBe('PATCH');
		expect(request.request.headers.get('If-Match')).toBe('"1791885731123"');
	});

	it.each(CASES)('sends no If-Match without edited $name', (item: UpdateCase) => {
		// Arrange
		const api: unknown = TestBed.inject(item.api);

		// Act
		call(api, item, undefined);
		const request = controller.expectOne(item.url);

		// Assert
		expect(request.request.headers.has('If-Match')).toBe(false);
	});

	it('sends the If-Match of the edited project', () => {
		// Arrange
		const api = TestBed.inject(ProjectApi);

		// Act
		api.updateProjectById('p1', {} as never, '"1"').subscribe();
		const request = controller.expectOne(`${BACKEND}/projects/p1`);

		// Assert
		expect(request.request.headers.get('If-Match')).toBe('"1"');
	});
});

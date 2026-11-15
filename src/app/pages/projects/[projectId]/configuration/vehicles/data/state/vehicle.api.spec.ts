import { expect } from 'vitest';

import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api';
import {
	ApiCase,
	describeApi,
	expectMapped,
	expectMappedPage,
	PAGE_QUERY,
} from '@shared/helpers/testing/api-test.helper';
import {
	MOVEMENT_DTO,
	pageDto,
	VEHICLE_DTO,
	VEHICLE_TIMELINE_DTO,
	WHEN,
} from '@shared/helpers/testing/response-fixtures';

const BASE = '/api/v2/projects/p1/vehicles';
const PARAMS = { resetSearch: false, q: 'x' } as never;

const CASES: ApiCase<VehicleApi>[] = [
	{
		name: 'reads the timeline of a vehicle',
		method: 'GET',
		url: `${BASE}/v1/timeline`,
		call: (api: VehicleApi) => api.findVehicleTimeline('p1', 'v1'),
		response: VEHICLE_TIMELINE_DTO,
		verify: (result: unknown) =>
			expect(result).toEqual({
				planned: [{ start: undefined, end: { date: '2026-07-20', time: undefined } }],
				actual: [{ start: new Date(WHEN), end: new Date(WHEN), ongoing: false }],
				outSeconds: 7200,
				usageRate: undefined,
			}),
	},
	{
		name: 'pages the elements with the search parameters',
		method: 'GET',
		url: new RegExp(`${BASE}\\?${PAGE_QUERY}&q=x$`),
		call: (api: VehicleApi) => api.findVehicles('p1', 0, 10, PARAMS),
		response: pageDto([VEHICLE_DTO]),
		verify: expectMappedPage,
	},
	{
		name: 'finds an element by id',
		method: 'GET',
		url: `${BASE}/v1`,
		call: (api: VehicleApi) => api.findVehicleById('p1', 'v1'),
		response: VEHICLE_DTO,
		verify: expectMapped,
	},
	{
		name: 'creates an element',
		method: 'POST',
		url: BASE,
		body: { name: 'x' },
		call: (api: VehicleApi) => api.createVehicle('p1', { name: 'x' } as never),
		response: VEHICLE_DTO,
		verify: expectMapped,
	},
	{
		name: 'updates an element',
		method: 'PATCH',
		url: `${BASE}/v1`,
		body: { name: 'y' },
		call: (api: VehicleApi) => api.updateVehicleById('p1', 'v1', { name: 'y' } as never),
		response: VEHICLE_DTO,
		verify: expectMapped,
	},
	{
		name: 'disables an element',
		method: 'POST',
		url: `${BASE}/v1/disable`,
		call: (api: VehicleApi) => api.softDeleteVehicleById('p1', 'v1'),
		response: VEHICLE_DTO,
		verify: expectMapped,
	},
	{
		name: 'enables an element',
		method: 'POST',
		url: `${BASE}/v1/enable`,
		call: (api: VehicleApi) => api.restoreVehicleById('p1', 'v1'),
		response: VEHICLE_DTO,
		verify: expectMapped,
	},
	{
		name: 'deletes an element',
		method: 'DELETE',
		url: `${BASE}/v1`,
		call: (api: VehicleApi) => api.hardDeleteVehicleById('p1', 'v1'),
	},
	{
		name: 'pages the movements of a vehicle',
		method: 'GET',
		url: new RegExp(`${BASE}/v1/movements\\?${PAGE_QUERY}`),
		call: (api: VehicleApi) => api.findVehicleMovements('p1', 'v1', 0, 10, PARAMS),
		response: pageDto([MOVEMENT_DTO]),
		verify: expectMappedPage,
	},
];

describeApi('VehicleApi', VehicleApi, CASES);

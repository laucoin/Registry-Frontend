import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { MetadataApi } from '@core/registry/state/metadata.api';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { MovementStore } from '@pages/projects/[projectId]/movements/data/state/movement.store';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { defined } from '@shared/helpers/testing/defined';
import { ERROR_500, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { ErrorModel } from '@shared/models/model/error.model';
import { GroupModel } from '@shared/models/model/group.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

const SEARCHED_AT = new Date('2026-01-01T10:00:00Z');

const MOVEMENT = {
	id: 'm1',
	dateTime: new Date(),
	type: { label: 'In', value: MovementTypeEnum.IN },
	content: [{}, {}],
} as unknown as MovementModel;

describe('MovementFacade', () => {
	let facade: MovementFacade;
	let findMovements: Mock<MovementApi['findMovements']>;
	let createMovement: Mock<MovementApi['createMovement']>;
	let createGuestsMovement: Mock<MovementApi['createGuestsMovement']>;
	let updateMovementById: Mock<MovementApi['updateMovementById']>;
	let updateGuestsMovementById: Mock<MovementApi['updateGuestsMovementById']>;
	let softDeleteMovementById: Mock<MovementApi['softDeleteMovementById']>;
	let notify: Mock<(message: unknown) => void>;
	let api: Record<string, Mock>;

	beforeEach(() => {
		provideTestConfig();
		findMovements = vi.fn(() => of(pageOf<MovementModel>([], 2)));
		createMovement = vi.fn(() => of(MOVEMENT));
		createGuestsMovement = vi.fn(() => of(MOVEMENT));
		updateMovementById = vi.fn(() => of(MOVEMENT));
		updateGuestsMovementById = vi.fn(() => of(MOVEMENT));
		softDeleteMovementById = vi.fn();
		notify = vi.fn();
		api = {
			findMovementById: vi.fn(),
			restoreMovementById: vi.fn(),
			hardDeleteMovementById: vi.fn(),
			findMovementCommunications: vi.fn(() => of(pageOf<never>([], 0))),
			searchReasonsAndActivities: vi.fn(() => of([])),
			searchParticipantsAndGroups: vi.fn(() => of({ participants: [], groups: [] })),
			searchVehicles: vi.fn(() => of([])),
		};
		TestBed.configureTestingModule({
			providers: [
				MovementFacade,
				MovementStore,
				{
					provide: MovementApi,
					useValue: {
						findMovements,
						createMovement,
						createGuestsMovement,
						updateMovementById,
						updateGuestsMovementById,
						softDeleteMovementById,
						...api,
						findMovementsContents: vi.fn(() => of([])),
					},
				},
				{
					provide: MetadataApi,
					useValue: { getMovementsTypes: vi.fn(() => of([])), getParticipantsTypes: vi.fn(() => of([])) },
				},
				{ provide: DateFormatPipe, useValue: { transform: (): string => '01/01' } },
				{
					provide: PluralTranslationPipe,
					useValue: { transform: (key: string, count: unknown[]): string => `${key}:${count?.length}` },
				},
				{ provide: SessionFacade, useValue: { currentProjectId: signal('p1') } },
				{ provide: UiFacade, useValue: { notify } },
				{
					provide: TranslocoService,
					useValue: {
						translate: (key: string): string => `t:${key}`,
						langChanges$: new Subject<string>().asObservable(),
					},
				},
			],
		});
		facade = TestBed.inject(MovementFacade);
		facade.fetchMovementsPage(2, 10);
		findMovements.mockClear();
	});

	it('fetches the requested page for the selected project', () => {
		// Arrange
		const page = 3;

		// Act
		facade.fetchMovementsPage(page, 10);

		// Assert
		expect(findMovements).toHaveBeenCalledWith('p1', 3, 10, expect.anything());
	});

	it('restarts from the first page when the search changed', () => {
		// Arrange
		facade.inputPageSearchParameters('IN', undefined, undefined, undefined);

		// Act
		facade.fetchMovementsPage(4, 10);

		// Assert
		expect(findMovements).toHaveBeenCalledWith('p1', 0, 10, expect.anything());
	});

	it('registers a movement of registered participants through the registered endpoint', () => {
		// Arrange
		const movement = {} as never;

		// Act
		facade.createRegisteredMovement(movement).subscribe();

		// Assert
		expect(createMovement).toHaveBeenCalledTimes(1);
		expect(createGuestsMovement).not.toHaveBeenCalled();
	});

	it('registers a movement of guests through the guests endpoint', () => {
		// Arrange
		const movement = {} as never;

		// Act
		facade.createGuestMovement(movement).subscribe();

		// Assert
		expect(createGuestsMovement).toHaveBeenCalledTimes(1);
		expect(createMovement).not.toHaveBeenCalled();
	});

	it('updates registered movements through the registered endpoint', () => {
		// Arrange
		const movement = {} as never;

		// Act
		facade.updateRegisteredMovement('m1', movement).subscribe();

		// Assert
		expect(updateMovementById).toHaveBeenCalledTimes(1);
		expect(updateGuestsMovementById).not.toHaveBeenCalled();
	});

	it('updates guests movements through the guests endpoint', () => {
		// Arrange
		const movement = {} as never;

		// Act
		facade.updateGuestMovement('m1', movement).subscribe();

		// Assert
		expect(updateGuestsMovementById).toHaveBeenCalledTimes(1);
		expect(updateMovementById).not.toHaveBeenCalled();
	});

	it('pluralizes the creation message by the number of people and counts them', () => {
		// Arrange
		const movement = {} as never;

		// Act
		facade.createRegisteredMovement(movement).subscribe();

		// Assert
		expect(notify).toHaveBeenCalledWith(
			expect.objectContaining({
				summary: 'movements.notifications.create.IN.title',
				detail: 'movements.notifications.create.IN.message:2',
				data: { datetime: '01/01', participants: 2 },
			}),
		);
	});

	it('uses the edit translation keys for an update', () => {
		// Arrange
		const movement = {} as never;

		// Act
		facade.updateRegisteredMovement('m1', movement).subscribe();

		// Assert
		expect(notify).toHaveBeenCalledWith(
			expect.objectContaining({ summary: 'movements.notifications.edit.IN.title' }),
		);
	});

	it('lets the form handle a creation error other than 503', () => {
		// Arrange
		createMovement.mockReturnValue(failing(ERROR_500));
		let received: ErrorModel | undefined;

		// Act
		facade.createRegisteredMovement({} as never).subscribe({
			error: (error: ErrorModel) => {
				received = error;
			},
		});

		// Assert
		expect(received).toBe(ERROR_500);
		expect(notify).not.toHaveBeenCalled();
	});

	it('reloads every shown batch of the movements in one request', () => {
		// Arrange
		findMovements.mockReturnValue(of(pageOf<MovementModel>([], 1)));
		facade.fetchMovementsPage(1, 10);
		findMovements.mockClear();

		// Act
		facade.reloadMovementsPage();

		// Assert
		expect(findMovements).toHaveBeenCalledWith(
			'p1',
			0,
			defined(facade.movementsPage()).size * 2,
			expect.anything(),
		);
	});

	it('fetches a movement of the selected project', () => {
		// Arrange
		api['findMovementById'].mockReturnValue(of(MOVEMENT));
		let received: MovementModel | undefined;

		// Act
		facade.fetchMovement('m1').subscribe((it) => {
			received = it;
		});

		// Assert
		expect(api['findMovementById']).toHaveBeenCalledWith('p1', 'm1');
		expect(received?.id).toBe('m1');
	});

	it('notifies a failed movement fetch', () => {
		// Arrange
		api['findMovementById'].mockReturnValue(failing(ERROR_500));

		// Act
		facade.fetchMovement('m1').subscribe({ error: (): void => undefined });

		// Assert
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Title' }));
	});

	it.each(['softDelete', 'restore'] as const)(
		'announces the movement %s on the current-page reload channel',
		(command) => {
			// Arrange
			softDeleteMovementById.mockReturnValue(of(MOVEMENT));
			api['restoreMovementById'].mockReturnValue(of(MOVEMENT));
			const reloaded: Mock = vi.fn();
			facade.handleMovementCurrentPageReload().subscribe(reloaded);

			// Act
			const run$ = command === 'softDelete' ? facade.softDeleteMovement('m1') : facade.restoreMovement('m1');
			run$.subscribe();

			// Assert
			expect(reloaded).toHaveBeenCalledTimes(1);
			expect(notify).toHaveBeenCalledWith(
				expect.objectContaining({ summary: `movements.notifications.${command}.IN.title` }),
			);
		},
	);

	it('announces a deletion on the first-page reload channel and refreshes the page', () => {
		// Arrange
		api['hardDeleteMovementById'].mockReturnValue(of(undefined));
		const reloaded: Mock = vi.fn();
		facade.handleMovementFirstPageReload().subscribe(reloaded);

		// Act
		facade.hardDeleteMovement(MOVEMENT).subscribe();

		// Assert
		expect(api['hardDeleteMovementById']).toHaveBeenCalledWith(undefined, 'm1');
		expect(reloaded).toHaveBeenCalledTimes(1);
		expect(findMovements).toHaveBeenCalledTimes(1);
	});

	it('does not refresh the page when a deletion fails', () => {
		// Arrange
		api['hardDeleteMovementById'].mockReturnValue(failing(ERROR_500));

		// Act
		facade.hardDeleteMovement(MOVEMENT).subscribe({ error: (): void => undefined });

		// Assert
		expect(findMovements).not.toHaveBeenCalled();
	});

	it('loads the next page of older communications only while there is one', () => {
		// Arrange
		api['findMovementCommunications'].mockReturnValue(of({ ...pageOf<never>([], 0), hasNext: true }));
		facade.fetchMovementCommunicationsPage('m1', 0, 10);
		api['findMovementCommunications'].mockClear();

		// Act
		facade.loadOlderMovementCommunications('m1');

		// Assert
		expect(api['findMovementCommunications']).toHaveBeenCalledWith('p1', 'm1', 1, 10, expect.anything());
	});

	it('loads no older communications when the shown page is the last one', () => {
		// Arrange
		facade.fetchMovementCommunicationsPage('m1', 0, 10);
		api['findMovementCommunications'].mockClear();

		// Act
		facade.loadOlderMovementCommunications('m1');

		// Assert
		expect(api['findMovementCommunications']).not.toHaveBeenCalled();
	});

	it('reloads the shown communications of a movement in one request', () => {
		// Arrange
		facade.fetchMovementCommunicationsPage('m1', 0, 10);
		api['findMovementCommunications'].mockClear();

		// Act
		facade.reloadMovementCommunications('m1');

		// Assert
		expect(api['findMovementCommunications']).toHaveBeenCalledWith(
			'p1',
			'm1',
			0,
			expect.any(Number),
			expect.anything(),
		);
	});

	it('searches the reasons, participants and vehicles of the selected project', () => {
		// Arrange
		const query = 'ada';

		// Act
		facade.searchReasonsAndActivities(query, 'IN', ParticipantTypeEnum.REGISTERED);
		facade.searchParticipantsAndGroups(ParticipantTypeEnum.REGISTERED, query, SEARCHED_AT, true);
		facade.searchVehicles(query);

		// Assert
		expect(api['searchReasonsAndActivities']).toHaveBeenCalledWith(
			'p1',
			'ada',
			'IN',
			ParticipantTypeEnum.REGISTERED,
		);
		expect(api['searchParticipantsAndGroups']).toHaveBeenCalledWith(
			'p1',
			ParticipantTypeEnum.REGISTERED,
			'ada',
			SEARCHED_AT,
			true,
		);
		expect(api['searchVehicles']).toHaveBeenCalledWith('p1', 'ada');
	});

	it('exposes the date bounds, the type and the visibility of the search once input', () => {
		// Arrange
		const from = new Date('2026-01-01T00:00:00.000Z');
		const to = new Date('2026-02-01T00:00:00.000Z');

		// Act
		facade.inputPageSearchParameters('IN', from, to, true);

		// Assert
		expect(facade.movementsPageFromParam()?.toISOString()).toBe(from.toISOString());
		expect(facade.movementsPageToParam()?.toISOString()).toBe(to.toISOString());
		expect(facade.movementsPageTypeParam()).toBe('IN');
		expect(facade.movementsPageIsVisibleParam()).toBe(true);
	});

	it('keeps the search when the same values are input again', () => {
		// Arrange
		facade.inputPageSearchParameters('IN', undefined, undefined, undefined);

		// Act
		facade.inputPageSearchParameters('IN', undefined, undefined, undefined);

		// Assert
		expect(facade.movementsPageTypeParam()).toBe('IN');
	});

	it('translates the visibility labels except the empty option', () => {
		// Arrange
		const expectedPrefix = 't:';

		// Act
		const labels = facade.visibilitiesMetadata().map((item: { label?: string }) => item.label);

		// Assert
		expect(labels.every((it) => it === '-' || defined(it).startsWith(expectedPrefix))).toBe(true);
	});

	it('counts no participant in the notification of a movement without content', () => {
		// Arrange
		softDeleteMovementById.mockReturnValue(of({ ...MOVEMENT, content: undefined } as unknown as MovementModel));

		// Act
		facade.softDeleteMovement('m1').subscribe();

		// Assert
		expect(notify).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ participants: 0 }) }),
		);
	});

	it('restarts the communications from the first page when their search was reset', () => {
		// Arrange
		facade.fetchMovementCommunicationsPage('m1', 3, 10);

		// Act
		facade.fetchMovementCommunicationsPage('m1', 4, 10);

		// Assert
		expect(api['findMovementCommunications']).toHaveBeenLastCalledWith('p1', 'm1', 4, 10, expect.anything());
	});

	it.each([
		{
			name: 'groups and participants under labels pluralized by their own count',
			found: {
				participants: [{ id: 'pa1', firstName: 'Ada', lastName: 'L' } as ParticipantModel],
				groups: [{ id: 'g1', name: 'A' } as GroupModel, { id: 'g2', name: 'B' } as GroupModel],
			},
			labels: [
				't:movements.form.content.registered.searched.group:2',
				't:movements.form.content.registered.searched.participant:1',
			],
		},
		{ name: 'no section when nothing is found', found: { participants: [], groups: [] }, labels: [] },
	])('offers the searched $name', ({ found, labels }) => {
		// Arrange
		api['searchParticipantsAndGroups'].mockReturnValue(of(found));

		// Act
		facade.searchParticipantsAndGroups(ParticipantTypeEnum.REGISTERED, 'a', new Date(), false);

		// Assert
		expect(facade.searchedParticipantAndGroupMetadata().map((section) => section.label)).toEqual(labels);
	});

	it('offers no section before any search', () => {
		// Arrange
		const sections = facade.searchedParticipantAndGroupMetadata();

		// Act
		const count = sections.length;

		// Assert
		expect(count).toBe(0);
	});
});

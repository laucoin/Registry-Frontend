import { Location } from '@angular/common';
import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { RegisteredMovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement-form.page';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { defined } from '@shared/helpers/testing/defined';
import { MOVEMENT_DTO, PARTICIPANT_DTO, VEHICLE_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';

interface ModelApi {
	information: { dateTime: Date | null; type: string };
	content: {
		reason: { kind: string; value: string; label: string } | null;
		participants: { participant: { id: string }; poolName?: string }[];
	};
	vehicles: { vehicle: { id: string }; driver: { id: string } | null }[];
}

interface PageApi {
	model: { (): ModelApi; update: (fn: (value: ModelApi) => ModelApi) => void };
	activeTab: () => number;
	form: { information: { type: () => { disabled: () => boolean } } };
	drivers: () => { value: { id: string } }[];
	reasonRequired: () => boolean;
	reasonOptions: () => { value: string }[];
	suggestions: () => { value: { id: string } }[];
	vehicleStep: () => boolean;
	interpretedMovementType: () => PresenceStatusEnum[];
	groupLabel: (name: string) => string;
	identifyContent: (content: ContentApi) => string;
	groupOfContent: (content: ContentApi) => string | undefined;
	contentLabel: (content: ContentApi) => { label?: string; value: unknown };
	participantWarning: (content: { participant: { status: { value: PresenceStatusEnum } } }) => string | undefined;
	vehicleWarning: (vehicle: { status: { value: PresenceStatusEnum } }) => string | undefined;
	handleTypeChange: (event: unknown) => void;
	handleReasonChoice: (event: unknown) => void;
	handleReasonSearch: (query: string) => void;
	handleParticipantsAndGroupsSearch: (searched: { query: string }) => void;
	handleAllParticipantsChange: (event: Event) => void;
	handleVehicleSearch: (query: string) => void;
	handleVehicleChoice: (event: unknown) => void;
	handleDriverChoice: (index: number, event: unknown) => void;
	removeVehicle: (index: number) => void;
	goTo: (step: number) => void;
	nextFromInformation: () => void;
	nextFromContent: () => void;
	submit: () => void;
}

interface ContentApi {
	participant: { id: string; firstName: string; lastName: string };
	poolName?: string;
}

function choice(value: string): { target: { value: string } } {
	return { target: { value } };
}

function major(): object {
	return structuredClone({ ...PARTICIPANT_DTO, id: 'pa1', major: true });
}

describe('RegisteredMovementFormPage', () => {
	let facade: Record<string, Mock>;
	let back: Mock<() => void>;

	function create(id: string | undefined = undefined, vehicleOption = false): PageApi {
		facade = autoMock();
		back = vi.fn();
		facade['fetchMovement'].mockReturnValue(of(MOVEMENT_DTO));
		facade['createRegisteredMovement'].mockReturnValue(of(MOVEMENT_DTO));
		facade['updateRegisteredMovement'].mockReturnValue(of(MOVEMENT_DTO));
		RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel;
		RegistryConfig.environment = {
			production: false,
			backend: { url: 'http://backend.test', noAuthPaths: [] },
			hosting: { providerName: null, providerAddress: null },
		};
		TestBed.configureTestingModule({
			providers: [
				{ provide: MovementFacade, useValue: facade },
				{ provide: Location, useValue: { back } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: id ? { movementId: id } : {} } } },
				{
					provide: SessionFacade,
					useValue: {
						selectedProject: signal(undefined),
						selectedProjectHasOption: (): Signal<boolean> => signal(vehicleOption),
						currentUser: signal(undefined),
					},
				},
				{ provide: UiFacade, useValue: autoMock() },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => key } },
			],
		});
		TestBed.overrideComponent(RegisteredMovementFormPage, { set: { template: '', imports: [], providers: [] } });
		return TestBed.createComponent(RegisteredMovementFormPage).componentInstance as unknown as PageApi;
	}

	function fillArrival(page: PageApi): void {
		page.handleTypeChange(choice(MovementTypeEnum.IN));
		page.model.update((value): ModelApi => ({
			...value,
			content: { ...value.content, participants: [{ participant: major(), poolName: 'car 1' } as never] },
		}));
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
	});

	describe('type and reason', () => {
		it.each([
			[MovementTypeEnum.IN, false, [PresenceStatusEnum.IN]],
			[MovementTypeEnum.OUT, true, [PresenceStatusEnum.UNAVAILABLE, PresenceStatusEnum.OUT]],
		])('for a %s, reason required=%s and statuses %j', (type: string, required, statuses) => {
			// Arrange
			const page = create();

			// Act
			page.handleTypeChange(choice(type));

			// Assert
			expect([page.reasonRequired(), page.interpretedMovementType()]).toEqual([required, statuses]);
		});

		it('forgets the chosen reason when the type changes', () => {
			// Arrange
			const page = create();
			page.model.update((value): ModelApi => ({
				...value,
				content: { ...value.content, reason: { kind: 'REASON', value: 'r1', label: '' } },
			}));

			// Act
			page.handleTypeChange(choice(MovementTypeEnum.OUT));

			// Assert
			expect(page.model().content.reason).toBeNull();
		});

		it('chooses a reason among the searched ones and clears it for an unknown key', () => {
			// Arrange
			const page = create();
			facade['searchedReasonAndActivityMetadata'].mockReturnValue([
				{ kind: 'ACTIVITY', value: 'a1', label: 'Activity' },
			]);

			// Act
			page.handleReasonChoice(choice('ACTIVITY:a1'));
			const chosen = page.model().content.reason;
			page.handleReasonChoice(choice('unknown'));

			// Assert
			expect(chosen?.value).toBe('a1');
			expect(page.model().content.reason).toBeNull();
			expect(page.reasonOptions()).toHaveLength(1);
		});

		it('flattens the searched participants and groups into suggestions', () => {
			// Arrange
			const page = create();
			facade['searchedParticipantAndGroupMetadata'].mockReturnValue([
				{ items: [{ value: { id: 'a' } }] },
				{ items: [{ value: { id: 'b' } }] },
			]);

			// Act
			const ids = page.suggestions().map((option) => option.value.id);

			// Assert
			expect(ids).toEqual(['a', 'b']);
		});
	});

	describe('content labels', () => {
		it('warns about a participant or a vehicle whose status the movement contradicts', () => {
			// Arrange
			const page = create();
			page.handleTypeChange(choice(MovementTypeEnum.IN));

			// Act
			const warned = page.participantWarning({
				participant: { status: { value: PresenceStatusEnum.IN } },
			});
			const vehicle = page.vehicleWarning({ status: { value: PresenceStatusEnum.IN } });
			const fine = page.participantWarning({
				participant: { status: { value: PresenceStatusEnum.OUT } },
			});

			// Assert
			expect([warned, vehicle, fine]).toEqual([
				'movements.form.warning.participant.IN',
				'movements.form.warning.vehicle.IN',
				undefined,
			]);
		});

		it('does not warn about a participant whose status is unknown, as in a movement being edited', () => {
			// Arrange
			const page = create();
			page.handleTypeChange(choice(MovementTypeEnum.IN));

			// Act
			const warning = page.participantWarning({ participant: {} } as never);

			// Assert
			expect(warning).toBeUndefined();
		});

		it('names a group with its translation', () => {
			// Arrange
			const page = create();

			// Act
			const label = page.groupLabel('team');

			// Assert
			expect(label).toBe('movements.form.content.registered.group');
		});
	});

	describe('vehicles', () => {
		it('adds the chosen vehicle waiting for a driver and removes it', () => {
			// Arrange
			const page = create();
			facade['searchedVehicleMetadata'].mockReturnValue([{ value: VEHICLE_DTO }]);
			const target = { value: VEHICLE_DTO.id };

			// Act
			page.handleVehicleChoice({ target });
			page.handleVehicleChoice({ target: { value: 'unknown' } });
			const added = page.model().vehicles;
			page.removeVehicle(0);

			// Assert
			expect(added).toHaveLength(1);
			expect(added[0].driver).toBeNull();
			expect(added[0].vehicle).not.toBe(VEHICLE_DTO);
			expect(target.value).toBe('');
			expect(page.model().vehicles).toEqual([]);
		});

		it('only offers the adult participants as drivers and sets the chosen one', () => {
			// Arrange
			const page = create();
			facade['searchedVehicleMetadata'].mockReturnValue([{ value: VEHICLE_DTO }]);
			page.handleVehicleChoice({ target: { value: VEHICLE_DTO.id } });
			page.model.update((value): ModelApi => ({
				...value,
				content: {
					...value.content,
					participants: [
						{ participant: major() } as never,
						{ participant: { ...major(), id: 'pa2', major: false } } as never,
					],
				},
			}));

			// Act
			page.handleDriverChoice(0, choice('pa1'));
			const offered = page.drivers().map((driver) => driver.value.id);
			page.handleDriverChoice(0, choice('unknown'));

			// Assert
			expect(offered).toEqual(['pa1']);
			expect(page.model().vehicles[0].driver).toBeNull();
		});

		it('shows the vehicle step only when the project has the option or the movement has vehicles', () => {
			// Arrange
			const without = create();
			TestBed.resetTestingModule();
			const withOption = create(undefined, true);
			TestBed.resetTestingModule();
			const withVehicle = create('m1');

			// Act
			const results = [without.vehicleStep(), withOption.vehicleStep(), withVehicle.vehicleStep()];

			// Assert
			expect(results).toEqual([false, true, true]);
		});
	});

	describe('steps and searches', () => {
		it('goes to the content step only when the information is valid', () => {
			// Arrange
			const page = create();

			// Act
			page.nextFromInformation();
			const blocked = page.activeTab();
			page.handleTypeChange(choice(MovementTypeEnum.IN));
			page.nextFromInformation();

			// Assert
			expect([blocked, page.activeTab()]).toEqual([1, 2]);
		});

		it('goes to the vehicle step or saves from the content step, and goes back', () => {
			// Arrange
			const withVehicles = create(undefined, true);
			fillArrival(withVehicles);

			// Act
			withVehicles.nextFromContent();
			const onVehicles = withVehicles.activeTab();
			withVehicles.goTo(1);

			// Assert
			expect([onVehicles, withVehicles.activeTab()]).toEqual([3, 1]);
		});

		it('saves from the content step when there is no vehicle step', () => {
			// Arrange
			const page = create();
			fillArrival(page);

			// Act
			page.nextFromContent();

			// Assert
			expect(facade['createRegisteredMovement']).toHaveBeenCalledTimes(1);
		});

		it('stays on the content step when it is incomplete', () => {
			// Arrange
			const page = create();
			page.handleTypeChange(choice(MovementTypeEnum.OUT));

			// Act
			page.nextFromContent();

			// Assert
			expect(facade['createRegisteredMovement']).not.toHaveBeenCalled();
		});

		it('searches the participants again when the date of the movement changes', () => {
			// Arrange
			const page = create();
			page.handleParticipantsAndGroupsSearch({ query: 'ad' });
			TestBed.tick();
			facade['searchParticipantsAndGroups'].mockClear();
			const newDate = new Date('2026-03-01T10:00:00Z');

			// Act
			page.model.update((value): ModelApi => ({
				...value,
				information: { ...value.information, dateTime: newDate },
			}));
			TestBed.tick();

			// Assert
			expect(facade['searchParticipantsAndGroups']).toHaveBeenCalledWith(
				ParticipantTypeEnum.REGISTERED,
				'ad',
				newDate,
				false,
			);
		});

		it('does not search before the user has searched', () => {
			// Arrange
			const page = create();

			// Act
			TestBed.tick();

			// Assert
			expect(facade['searchParticipantsAndGroups']).not.toHaveBeenCalled();
			expect(page.model().information.dateTime).not.toBeNull();
		});

		it('searches again with the toggle when the participants are widened to the whole project', () => {
			// Arrange
			const page = create();
			page.handleParticipantsAndGroupsSearch({ query: 'ad' });

			// Act
			page.handleAllParticipantsChange({ target: { checked: true } } as unknown as Event);

			// Assert
			expect(facade['searchParticipantsAndGroups']).toHaveBeenLastCalledWith(
				ParticipantTypeEnum.REGISTERED,
				'ad',
				expect.any(Date),
				true,
			);
		});

		it('searches reasons with the chosen type, then participants, groups and vehicles', () => {
			// Arrange
			const page = create();
			page.handleTypeChange(choice(MovementTypeEnum.OUT));

			// Act
			page.handleReasonSearch('arr');
			page.handleParticipantsAndGroupsSearch({ query: 'ad' });
			page.handleVehicleSearch('ab');

			// Assert
			expect(facade['searchReasonsAndActivities']).toHaveBeenCalledWith(
				'arr',
				'OUT',
				ParticipantTypeEnum.REGISTERED,
			);
			expect(facade['searchParticipantsAndGroups']).toHaveBeenCalledWith(
				ParticipantTypeEnum.REGISTERED,
				'ad',
				expect.any(Date),
				false,
			);
			expect(facade['searchVehicles']).toHaveBeenCalledWith('ab');
		});
	});

	describe('saving', () => {
		it('does not save while the form is incomplete', () => {
			// Arrange
			const page = create();

			// Act
			page.submit();

			// Assert
			expect(facade['createRegisteredMovement']).not.toHaveBeenCalled();
		});

		it('creates the movement from the form and goes back', () => {
			// Arrange
			const page = create();
			fillArrival(page);

			// Act
			page.submit();

			// Assert
			expect(facade['createRegisteredMovement']).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'IN',
					content: [{ poolName: 'car 1', participantId: 'pa1', vehicleId: undefined }],
				}),
			);
			expect(back).toHaveBeenCalledTimes(1);
		});

		it('does not save a vehicle without a driver', () => {
			// Arrange
			const page = create();
			facade['searchedVehicleMetadata'].mockReturnValue([{ value: VEHICLE_DTO }]);
			fillArrival(page);
			page.handleVehicleChoice({ target: { value: VEHICLE_DTO.id } });

			// Act
			page.submit();

			// Assert
			expect(facade['createRegisteredMovement']).not.toHaveBeenCalled();
		});
	});

	describe('editing', () => {
		it('loads the movement, locks its type and fills the content', () => {
			// Arrange
			const id = 'm1';

			// Act
			const page = create(id);

			// Assert
			expect(facade['fetchMovement']).toHaveBeenCalledWith('m1');
			expect(page.form.information.type().disabled()).toBe(true);
			expect(page.model().content.participants).toHaveLength(1);
			expect(defined(page.model().vehicles[0].driver).id).toBe('pa1');
		});

		it('updates the loaded movement', () => {
			// Arrange
			const page = create('m1');

			// Act
			page.submit();

			// Assert
			expect(facade['updateRegisteredMovement']).toHaveBeenCalledWith(
				'm1',
				expect.objectContaining({ type: 'IN' }),
				WHEN_ETAG,
			);
			expect(facade['createRegisteredMovement']).not.toHaveBeenCalled();
		});
	});

	describe('prefill', () => {
		afterEach(() => history.replaceState(null, ''));

		it('starts on the content step with the prefilled participants', () => {
			// Arrange
			history.replaceState(
				{
					movementPrefill: {
						type: MovementTypeEnum.IN,
						reason: undefined,
						content: [{ participant: { id: 'pa1', firstName: 'Ada', lastName: 'Lovelace' } }],
					},
				},
				'',
			);

			// Act
			const page = create();

			// Assert
			expect(page.activeTab()).toBe(2);
			expect(page.model().content.participants).toHaveLength(1);
		});

		it('keeps the information step when there is nothing to prefill', () => {
			// Arrange
			history.replaceState(null, '');

			// Act
			const page = create();

			// Assert
			expect(page.activeTab()).toBe(1);
		});
	});

	describe('content rows', () => {
		const content: ContentApi = {
			participant: { id: 'pa1', firstName: 'Ada', lastName: 'Lovelace' },
			poolName: 'P1',
		};

		it('identifies, groups and labels a content row from its participant', () => {
			// Arrange
			const page = create();

			// Act
			const results: unknown[] = [
				page.identifyContent(content),
				page.groupOfContent(content),
				page.contentLabel(content).label,
			];

			// Assert
			expect(results).toEqual(['pa1', 'P1', 'Ada Lovelace']);
		});
	});
});

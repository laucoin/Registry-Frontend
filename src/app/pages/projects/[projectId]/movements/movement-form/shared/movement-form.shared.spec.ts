import { describe, expect, it } from 'vitest';

import {
	contentOfChoice,
	interpretedPresence,
	presenceWarningKey,
	reasonChoices,
	reasonFieldsOf,
	reasonKeyOf,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { MovementReasonKindEnum } from '@shared/models/enumeration/movement-reason-kind.enum';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { PresenceWarningSubjectEnum } from '@shared/models/enumeration/presence-warning-subject.enum';
import { GroupModel } from '@shared/models/model/group.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

const REASON: MovementReasonModel = { kind: MovementReasonKindEnum.REASON, value: 'r1', label: 'Reason' };
const ACTIVITY: MovementReasonModel = { kind: MovementReasonKindEnum.ACTIVITY, value: 'a1', label: 'Activity' };

describe('movement form shared rules', () => {
	it.each([
		[MovementTypeEnum.IN, [PresenceStatusEnum.IN]],
		[MovementTypeEnum.OUT, [PresenceStatusEnum.UNAVAILABLE, PresenceStatusEnum.OUT]],
		['', []],
	])('interprets the %s type as %j', (type, expected: PresenceStatusEnum[]) => {
		// Arrange
		const given = type;

		// Act
		const statuses = interpretedPresence(given);

		// Assert
		expect(statuses).toEqual(expected);
	});

	it('identifies a reason by its kind and value, and nothing by an empty key', () => {
		// Arrange
		const none: MovementReasonModel | null = null;

		// Act
		const keys = [reasonKeyOf(REASON), reasonKeyOf(ACTIVITY), reasonKeyOf(none)];

		// Assert
		expect(keys).toEqual(['REASON:r1', 'ACTIVITY:a1', '']);
	});

	it('adds the chosen reason to the searched ones only when it is missing', () => {
		// Arrange
		const searched: MovementReasonModel[] = [ACTIVITY];

		// Act
		const missing = reasonChoices(searched, REASON);
		const known = reasonChoices(searched, ACTIVITY);
		const none = reasonChoices(searched, null);

		// Assert
		expect([missing, known, none]).toEqual([[REASON, ACTIVITY], [ACTIVITY], [ACTIVITY]]);
	});

	it('sends the reason as a reason or as an activity depending on its kind', () => {
		// Arrange
		const none: MovementReasonModel | null = null;

		// Act
		const fields: object[] = [reasonFieldsOf(REASON), reasonFieldsOf(ACTIVITY), reasonFieldsOf(none)];

		// Assert
		expect(fields).toEqual([
			{ reason: 'r1', activityId: undefined },
			{ reason: undefined, activityId: 'a1' },
			{ reason: undefined, activityId: undefined },
		]);
	});

	it('turns a chosen participant into one content and a chosen group into one content per member', () => {
		// Arrange
		const participant = structuredClone(PARTICIPANT_DTO) as unknown as ParticipantModel;
		const group = {
			name: 'team',
			members: [participant, { ...participant, id: 'pa2' }],
		} as unknown as GroupModel;

		// Act
		const single = contentOfChoice(participant);
		const grouped = contentOfChoice(group);
		const empty = contentOfChoice({
			name: 'void',
			members: undefined,
		} as unknown as GroupModel);

		// Assert
		expect(single).toEqual([{ poolName: undefined, participant, vehicle: undefined }]);
		expect(grouped.map((content) => content.poolName)).toEqual(['team', 'team']);
		expect(empty).toEqual([]);
	});

	it.each([
		{
			name: 'warns about a status the movement contradicts',
			status: PresenceStatusEnum.IN,
			expected: 'movements.form.warning.vehicle.IN',
		},
		{
			name: 'does not warn about a status the movement agrees with',
			status: PresenceStatusEnum.OUT,
			expected: undefined,
		},
		{ name: 'does not warn about an unknown status', status: undefined, expected: undefined },
	])('$name', ({ status, expected }) => {
		// Arrange
		const presence = [PresenceStatusEnum.IN];

		// Act
		const key = presenceWarningKey(PresenceWarningSubjectEnum.VEHICLE, status, presence);

		// Assert
		expect(key).toBe(expected);
	});
});

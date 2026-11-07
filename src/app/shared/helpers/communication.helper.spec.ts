import { describe, expect, it } from 'vitest';

import { CommunicationHelper } from '@shared/helpers/communication.helper';
import { CommunicationModel } from '@shared/models/model/communication.model';

describe('CommunicationHelper', () => {
	it('attributes a communication to its movement when the movement has a reason', () => {
		// Arrange
		const communication = {
			movement: { id: 'm1', reason: { label: 'Arrival' } },
			lastEdition: { user: { id: 'u1', firstName: 'Ada' } },
		} as unknown as CommunicationModel;

		// Act
		const authorId = CommunicationHelper.getAuthorId(communication);

		// Assert
		expect(authorId).toBe('m1');
	});

	it('falls back to the last editor when there is no movement reason', () => {
		// Arrange
		const communication = {
			movement: { id: 'm1', reason: { label: ' ' } },
			lastEdition: { user: { id: 'u1', firstName: 'Ada' } },
		} as unknown as CommunicationModel;

		// Act
		const authorId = CommunicationHelper.getAuthorId(communication);

		// Assert
		expect(authorId).toBe('u1');
	});

	it('has no author when neither can be identified', () => {
		// Arrange
		const communication = {} as CommunicationModel;

		// Act
		const authorId = CommunicationHelper.getAuthorId(communication);

		// Assert
		expect(authorId).toBeUndefined();
	});

	it('gives the author of the neighbours of a message', () => {
		// Arrange
		const byUser = (id: string): CommunicationModel =>
			({ lastEdition: { user: { id, firstName: 'Ada' } } }) as unknown as CommunicationModel;
		const conversation = [byUser('u1'), byUser('u2'), byUser('u3')];

		// Act
		const previous = CommunicationHelper.previousAuthorId(conversation, 1);
		const next = CommunicationHelper.nextAuthorId(conversation, 1);

		// Assert
		expect(previous).toBe('u1');
		expect(next).toBe('u3');
	});

	it('has no neighbour author at the ends of the conversation', () => {
		// Arrange
		const conversation = [
			{ lastEdition: { user: { id: 'u1', firstName: 'Ada' } } } as unknown as CommunicationModel,
		];

		// Act
		const previous = CommunicationHelper.previousAuthorId(conversation, 0);
		const next = CommunicationHelper.nextAuthorId(conversation, 0);

		// Assert
		expect(previous).toBeUndefined();
		expect(next).toBeUndefined();
	});

	it('has no neighbour author without a conversation or beyond its bounds', () => {
		// Arrange
		const conversation = [{} as CommunicationModel];

		// Act
		const withoutConversation = CommunicationHelper.previousAuthorId(undefined, 1);
		const beyondBounds = CommunicationHelper.nextAuthorId(conversation, 5);
		const unidentifiedNeighbour = CommunicationHelper.previousAuthorId(conversation, 1);

		// Assert
		expect(withoutConversation).toBeUndefined();
		expect(beyondBounds).toBeUndefined();
		expect(unidentifiedNeighbour).toBeUndefined();
	});

	it('lists the communications from the oldest to the latest without altering the page', () => {
		// Arrange
		const page = [{ id: 'new' } as CommunicationModel, { id: 'old' } as CommunicationModel];

		// Act
		const ordered = CommunicationHelper.chronological(page);

		// Assert
		expect(ordered.map((c) => c.id)).toEqual(['old', 'new']);
		expect(page[0].id).toBe('new');
		expect(CommunicationHelper.chronological(undefined)).toEqual([]);
	});
});

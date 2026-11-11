import { describe, expect, it } from 'vitest';

import { LegalDocumentHelper } from '@shared/helpers/legal-document.helper';
import { LegalBlockKindEnum } from '@shared/models/enumeration/legal-block-kind.enum';

describe('LegalDocumentHelper', () => {
	it.each([
		{
			name: 'paragraphs only',
			withList: false,
			blocks: [{ kind: LegalBlockKindEnum.PARAGRAPHS, key: 'doc.sections.rights.body' }],
		},
		{
			name: 'paragraphs then a list',
			withList: true,
			blocks: [
				{ kind: LegalBlockKindEnum.PARAGRAPHS, key: 'doc.sections.rights.body' },
				{ kind: LegalBlockKindEnum.LIST, key: 'doc.sections.rights.list' },
			],
		},
	])('describes a standard section with $name', ({ withList, blocks }) => {
		// Arrange
		const name = 'rights';

		// Act
		const section = LegalDocumentHelper.section('doc', name, withList);

		// Assert
		expect(section).toEqual({ titleKey: 'doc.sections.rights.title', blocks });
	});

	it('keeps the blocks of a custom section', () => {
		// Arrange
		const blocks = [{ kind: LegalBlockKindEnum.LINE, key: 'doc.sections.publisher.line' }];

		// Act
		const section = LegalDocumentHelper.custom('doc', 'publisher', blocks);

		// Assert
		expect(section).toEqual({ titleKey: 'doc.sections.publisher.title', blocks });
	});
});

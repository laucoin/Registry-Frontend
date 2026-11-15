import { Component } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { LegalDocumentHelper } from '@shared/helpers/legal-document.helper';
import { LegalBlockKindEnum } from '@shared/models/enumeration/legal-block-kind.enum';
import { LegalSectionModel } from '@shared/models/model/legal-document.model';
import { LegalDocumentComponent } from '@shared/ui/common/legal-document/legal-document.component';

const PREFIX = 'terms';
const SECTIONS: readonly LegalSectionModel[] = [
	LegalDocumentHelper.custom(PREFIX, 'publisher', [
		{ kind: LegalBlockKindEnum.LINE, key: 'terms.sections.publisher.identityLine' },
		{ kind: LegalBlockKindEnum.LINE, key: 'terms.sections.publisher.affiliationLine' },
		{
			kind: LegalBlockKindEnum.HOSTING,
			key: 'terms.sections.publisher.hostingClause',
			fallbackKey: 'terms.sections.publisher.hostingFallback',
		},
		{ kind: LegalBlockKindEnum.LINE, key: 'terms.sections.publisher.contactLine' },
	]),
	LegalDocumentHelper.section(PREFIX, 'definitions', true),
	LegalDocumentHelper.section(PREFIX, 'acceptance'),
	LegalDocumentHelper.section(PREFIX, 'access'),
	LegalDocumentHelper.section(PREFIX, 'description'),
	LegalDocumentHelper.section(PREFIX, 'roles'),
	LegalDocumentHelper.section(PREFIX, 'commitments', true),
	LegalDocumentHelper.section(PREFIX, 'minors'),
	LegalDocumentHelper.section(PREFIX, 'ip'),
	LegalDocumentHelper.section(PREFIX, 'availability'),
	LegalDocumentHelper.section(PREFIX, 'liability'),
	LegalDocumentHelper.section(PREFIX, 'retention'),
	LegalDocumentHelper.section(PREFIX, 'accountDeletion'),
	LegalDocumentHelper.section(PREFIX, 'changes'),
	LegalDocumentHelper.section(PREFIX, 'law'),
	LegalDocumentHelper.section(PREFIX, 'contact'),
];

/**
 * Objectif: Page statique des conditions d'utilisation.
 * Périmètre: Décrit les sections du document et le confie au composant de document légal.
 * Limites: Ne récupère aucune donnée et ne détient aucun état propre.
 */
@Component({
	selector: 'app-terms',
	imports: [LegalDocumentComponent],
	providers: [provideTranslocoScope('terms')],
	template: '<app-legal-document prefix="terms" updatedAt="2024-10-09" [sections]="sections" />',
})
export class TermsPage {
	protected readonly sections = SECTIONS;
}

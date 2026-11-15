import { Component } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { LegalDocumentHelper } from '@shared/helpers/legal-document.helper';
import { LegalBlockKindEnum } from '@shared/models/enumeration/legal-block-kind.enum';
import { LegalSectionModel } from '@shared/models/model/legal-document.model';
import { LegalDocumentComponent } from '@shared/ui/common/legal-document/legal-document.component';

const PREFIX = 'privacy';
const SECTIONS: readonly LegalSectionModel[] = [
	LegalDocumentHelper.section(PREFIX, 'controller'),
	LegalDocumentHelper.section(PREFIX, 'dataCollected', true),
	LegalDocumentHelper.section(PREFIX, 'purposes'),
	LegalDocumentHelper.section(PREFIX, 'legalBasis'),
	LegalDocumentHelper.section(PREFIX, 'recipients'),
	LegalDocumentHelper.section(PREFIX, 'minors'),
	LegalDocumentHelper.section(PREFIX, 'retention'),
	LegalDocumentHelper.section(PREFIX, 'cookies'),
	LegalDocumentHelper.section(PREFIX, 'security'),
	LegalDocumentHelper.custom(PREFIX, 'hosting', [
		{
			kind: LegalBlockKindEnum.HOSTING,
			key: 'privacy.sections.hosting.clause',
			fallbackKey: 'privacy.sections.hosting.fallback',
		},
	]),
	LegalDocumentHelper.section(PREFIX, 'rights'),
	LegalDocumentHelper.section(PREFIX, 'complaint'),
	LegalDocumentHelper.section(PREFIX, 'contact'),
	LegalDocumentHelper.section(PREFIX, 'changes'),
];

/**
 * Objectif: Page statique de politique de confidentialité.
 * Périmètre: Décrit les sections du document et le confie au composant de document légal.
 * Limites: Ne récupère aucune donnée et ne détient aucun état propre.
 */
@Component({
	selector: 'app-privacy',
	imports: [LegalDocumentComponent],
	providers: [provideTranslocoScope('privacy')],
	template: '<app-legal-document prefix="privacy" updatedAt="2024-10-09" [sections]="sections" />',
})
export class PrivacyPage {
	protected readonly sections = SECTIONS;
}

import { LegalBlockKindEnum } from '@shared/models/enumeration/legal-block-kind.enum';
import { LegalBlockModel, LegalSectionModel } from '@shared/models/model/legal-document.model';

/**
 * Objectif: Construit la description des sections d'un document légal à partir de leur nom.
 * Périmètre: Une section standard affiche ses paragraphes (`body`), suivis de sa liste (`list`) quand elle en a une ;
 * une section sur mesure reçoit ses blocs.
 * Limites: Ne vérifie pas que les clés existent dans les traductions.
 */
export const LegalDocumentHelper = {
	section(prefix: string, name: string, withList = false): LegalSectionModel {
		const base = `${prefix}.sections.${name}`;
		const list: LegalBlockModel[] = withList ? [{ kind: LegalBlockKindEnum.LIST, key: `${base}.list` }] : [];
		return {
			titleKey: `${base}.title`,
			blocks: [{ kind: LegalBlockKindEnum.PARAGRAPHS, key: `${base}.body` }, ...list],
		};
	},

	custom(prefix: string, name: string, blocks: readonly LegalBlockModel[]): LegalSectionModel {
		return { titleKey: `${prefix}.sections.${name}.title`, blocks };
	},
} as const;

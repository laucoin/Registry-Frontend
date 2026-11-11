import { LegalBlockKindEnum } from '@shared/models/enumeration/legal-block-kind.enum';

/**
 * Objectif: Décrit un bloc d'une section de document légal.
 * Périmètre: `paragraphs` et `list` lisent un tableau traduit, `line` un texte traduit, `hosting` la clause de
 * l'hébergeur (`key`) ou, sans hébergeur configuré, son texte de repli (`fallbackKey`).
 * Limites: Les clés sont complètes, préfixe du document compris.
 */
export interface LegalBlockModel {
	kind: LegalBlockKindEnum;
	key: string;
	fallbackKey?: string;
}

export interface LegalSectionModel {
	titleKey: string;
	blocks: readonly LegalBlockModel[];
}

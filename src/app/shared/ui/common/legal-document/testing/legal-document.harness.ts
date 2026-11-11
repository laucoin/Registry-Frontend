import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export interface LegalSectionView {
	title: string;
	texts: string[];
}

/**
 * Objectif: Pilote un document légal dans les tests.
 * Périmètre: Lit le titre, l'introduction, le titre et les paragraphes et éléments de liste de chaque section, et
 * la clause ou le repli d'hébergement.
 * Limites: Ne lit pas les liens du texte ni le bouton de retour.
 */
export class LegalDocumentHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-legal-document';

	private readonly heading = this.locatorFor(byTestId('legal-document-title'));
	private readonly intro = this.locatorForAll(byTestId('legal-document-intro'));
	private readonly sectionElements = this.locatorForAll(byTestId('legal-document-section'));
	private readonly clause = this.locatorForOptional(byTestId('legal-document-hosting-clause'));
	private readonly fallback = this.locatorForOptional(byTestId('legal-document-hosting-fallback'));

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async lede(): Promise<string | null> {
		return (await this.heading()).getProperty<string | null>('lede');
	}

	public async introParagraphs(): Promise<string[]> {
		return Promise.all((await this.intro()).map((paragraph) => paragraph.text()));
	}

	public async sections(): Promise<LegalSectionView[]> {
		const sections = await this.sectionElements();
		return Promise.all(
			sections.map(async (section) => {
				const key = await section.getAttribute('data-id');
				const scope = `${byTestId('legal-document-section')}[data-id="${key}"]`;
				const title = await (
					await this.locatorFor(`${scope} ${byTestId('legal-document-section-title')}`)()
				).text();
				const blocks = await this.locatorForAll(`${scope} p, ${scope} li`)();
				return { title, texts: await Promise.all(blocks.map(async (block) => (await block.text()).trim())) };
			}),
		);
	}

	public async hostingText(): Promise<{ clause: string | undefined; fallback: string | undefined }> {
		return {
			clause: (await (await this.clause())?.text())?.trim(),
			fallback: (await (await this.fallback())?.text())?.trim(),
		};
	}
}

import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';
import { SkeletonListHarness } from '@shared/ui/common/skeleton-list/testing/skeleton-list.harness';

/**
 * Objectif: Pilote le cadre commun des widgets dans les tests.
 * Périmètre: Lit le titre, le total, l'icône et le message vide ; donne l'erreur de section et le squelette de chargement.
 * Limites: Le contenu projeté est lu par le harness du widget.
 */
export class WidgetCardHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-widget-card';

	private readonly heading = this.locatorFor(byTestId('widget-card-title'));
	private readonly totalTag = this.locatorForOptional(byTestId('widget-card-total'));
	private readonly emptyText = this.locatorForOptional(byTestId('widget-card-empty'));
	private readonly iconElement = this.locatorFor('sgdf-table-cell[header] sgdf-icon');

	public readonly error = this.locatorForOptional(SectionErrorHarness);
	public readonly skeleton = this.locatorForOptional(SkeletonListHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async total(): Promise<string | undefined> {
		return (await (await this.totalTag())?.text())?.trim();
	}

	public async icon(): Promise<string | null> {
		return (await this.iconElement()).getAttribute('name');
	}

	public async empty(): Promise<string | undefined> {
		return (await (await this.emptyText())?.text())?.trim();
	}
}

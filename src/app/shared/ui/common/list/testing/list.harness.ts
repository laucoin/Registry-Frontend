import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { LoadMoreHarness } from '@shared/ui/common/load-more/testing/load-more.harness';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';
import { SkeletonListHarness } from '@shared/ui/common/skeleton-list/testing/skeleton-list.harness';

/**
 * Objectif: Pilote la liste paginée partagée dans les tests.
 * Périmètre: Lit l'en-tête, la zone de recherche, les états vide, sans résultat et d'erreur, la liste et ses
 * sous-composants (squelette, erreur, chargement du lot suivant), et réinitialise les filtres.
 * Limites: Ne lit pas les éléments projetés par la page ; le harness de la page les pilote.
 */
export class ListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-list';

	private readonly lastRefresh = this.locatorForOptional(byTestId('list-last-refresh'));
	private readonly searchItem = this.locatorForOptional(byTestId('list-search-item'));
	private readonly filtersTag = this.locatorForOptional(byTestId('list-active-filters-tag'));
	private readonly noResultCallout = this.locatorForOptional(byTestId('list-no-result-callout'));
	private readonly resetButton = this.locatorFor(byTestId('list-reset-filters-button'));
	private readonly emptyCallout = this.locatorForOptional(byTestId('list-empty-callout'));
	private readonly elements = this.locatorForOptional(byTestId('list-elements'));

	public readonly skeleton = this.locatorForOptional(SkeletonListHarness);
	public readonly error = this.locatorForOptional(SectionErrorHarness);
	public readonly loadMore = this.locatorForOptional(LoadMoreHarness);

	public async lastRefreshText(): Promise<string | undefined> {
		return (await this.lastRefresh())?.text();
	}

	public async searchExpanded(): Promise<boolean | undefined> {
		return (await this.searchItem())?.getProperty<boolean>('expanded');
	}

	public async activeFiltersText(): Promise<string | undefined> {
		return (await this.filtersTag())?.text();
	}

	public async noResultTitle(): Promise<string | undefined> {
		return (await this.noResultCallout())?.getProperty<string>('title');
	}

	public async resetFilters(): Promise<void> {
		return (await this.resetButton()).click();
	}

	public async emptyTitle(): Promise<string | undefined> {
		return (await this.emptyCallout())?.getProperty<string>('title');
	}

	public async listLabel(): Promise<string | undefined> {
		return (await this.elements())?.getProperty<string>('label');
	}
}

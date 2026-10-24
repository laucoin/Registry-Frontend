import { NgTemplateOutlet } from '@angular/common'
import {
	Component,
	computed,
	contentChildren,
	CUSTOM_ELEMENTS_SCHEMA,
	inject,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
	Signal,
	TemplateRef,
} from '@angular/core'
import { UiFacade } from '@core/registry/state/ui.facade'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/accordion'
import '@sgdf/ui/accordion-item'
import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/skeleton'
import '@sgdf/ui/tag'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'
import { GenericModel } from '@shared/models/model/generic.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { PageModel } from '@shared/models/model/page.model'
import { LoadMoreComponent } from '@shared/ui/common/load-more/load-more.component'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { SkeletonListComponent } from '@shared/ui/common/skeleton-list/skeleton-list.component'

const DEFAULT_PAGE_SIZE: number = 20

/**
 * Purpose: Affiche une liste d'éléments chargée paresseusement avec sa zone de recherche, ses états de chargement, d'erreur et de vide et un déclencheur « charger plus ».
 * Scope: Affiche les éléments donnés par la page dans un `sgdf-list` et émet le lot à récupérer ensuite, le nouvel essai et la réinitialisation des filtres.
 * Limits: Ne possède ni donnée ni formulaire de recherche ; la page fournit le modèle de page, les templates (recherche, création, élément, vide) et décide de ce que fait une demande.
 */
@Component({
	selector: 'app-list',
	imports: [NgTemplateOutlet, SkeletonListComponent, TranslocoPipe, DateFormatPipe, SectionErrorComponent, LoadMoreComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './list.component.html',
})
export class ListComponent<T extends GenericModel> {
	private readonly templates: Signal<readonly RegistryTemplateDirective[]> = contentChildren(RegistryTemplateDirective)
	private readonly uiFacade: UiFacade = inject(UiFacade)

	public readonly elementPage: InputSignal<PageModel<T> | undefined> = input.required()
	public readonly loading: InputSignal<boolean> = input.required()
	public readonly error: InputSignal<NotificationModel | undefined> = input.required()
	public readonly loadingMore: InputSignal<boolean> = input(false)
	public readonly activeFilters: InputSignal<number> = input(0)
	public readonly emptyMessagePrefix: InputSignal<string> = input('global.notifications.EMPTY')
	public readonly label: InputSignal<string | undefined> = input()

	public readonly updateRequired: OutputEmitterRef<PageEventModel> = output()
	public readonly filtersReset: OutputEmitterRef<void> = output()

	protected readonly searchExpanded: Signal<boolean> = computed((): boolean => !this.uiFacade.tinyScreen())
	protected readonly size: Signal<number> = computed((): number => this.elementPage()?.size ?? DEFAULT_PAGE_SIZE)
	protected readonly hasMore: Signal<boolean> = computed((): boolean => CumulativePageHelper.hasMore(this.elementPage()))
	protected readonly isEmpty: Signal<boolean> = computed((): boolean => this.elementPage()?.content.length === 0 && !this.loading())
	protected readonly showSkeleton: Signal<boolean> = computed((): boolean => this.loading() && !this.elementPage()?.content.length)

	protected loadMore(): void {
		this.updateRequired.emit({ page: (this.elementPage()?.page ?? -1) + 1, size: this.size() })
	}

	protected retry(): void {
		const shown: PageModel<T> | undefined = this.elementPage()
		this.updateRequired.emit({ page: shown ? shown.page + 1 : 0, size: this.size() })
	}

	protected getTemplate(name: string): TemplateRef<unknown> | null {
		return this.templates().find((template: RegistryTemplateDirective): boolean => template.appTemplate() === name)?.template ?? null
	}
}

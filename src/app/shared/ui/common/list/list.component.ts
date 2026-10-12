import { NgTemplateOutlet } from '@angular/common'
import {
	Component,
	computed,
	ContentChildren,
	CUSTOM_ELEMENTS_SCHEMA,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
	QueryList,
	Signal,
	TemplateRef,
} from '@angular/core'
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

const DEFAULT_PAGE_SIZE: number = 20
const SKELETON_ROWS: number = 6

/**
 * Purpose: Shows a lazily loaded list of elements with its search area, its loading, error and empty states and a "load more" trigger.
 * Scope: Renders the elements given by the page in an `sgdf-list` and emits the batch to fetch next, the retry and the filters reset.
 * Limits: Owns no data and no search form; the page supplies the page model, the templates (search, creation, element, empty) and decides what a request does.
 */
@Component({
	selector: 'app-list',
	imports: [NgTemplateOutlet, TranslocoPipe, DateFormatPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './list.component.html',
})
export class ListComponent<T extends GenericModel> {
	@ContentChildren(RegistryTemplateDirective) public templates: QueryList<RegistryTemplateDirective> | undefined

	public readonly elementPage: InputSignal<PageModel<T> | undefined> = input.required()
	public readonly loading: InputSignal<boolean> = input.required()
	public readonly error: InputSignal<NotificationModel | undefined> = input.required()
	public readonly loadingMore: InputSignal<boolean> = input(false)
	public readonly activeFilters: InputSignal<number> = input(0)
	public readonly emptyMessagePrefix: InputSignal<string> = input('global.notifications.EMPTY')

	public readonly updateRequired: OutputEmitterRef<PageEventModel> = output()
	public readonly filtersReset: OutputEmitterRef<void> = output()

	protected readonly skeletonRows: readonly number[] = Array.from({ length: SKELETON_ROWS }, (_: unknown, index: number): number => index)

	protected readonly pageSize: Signal<number> = computed((): number => this.elementPage()?.pageSize ?? DEFAULT_PAGE_SIZE)
	protected readonly hasMore: Signal<boolean> = computed((): boolean => CumulativePageHelper.hasMore(this.elementPage()))
	protected readonly isEmpty: Signal<boolean> = computed((): boolean => this.elementPage()?.content.length === 0 && !this.loading())
	protected readonly showSkeleton: Signal<boolean> = computed((): boolean => this.loading() && !this.elementPage()?.content.length)

	protected loadMore(): void {
		this.updateRequired.emit({ pageNumber: (this.elementPage()?.pageNumber ?? -1) + 1, pageSize: this.pageSize() })
	}

	protected retry(): void {
		const shown: PageModel<T> | undefined = this.elementPage()
		this.updateRequired.emit({ pageNumber: shown ? shown.pageNumber + 1 : 0, pageSize: this.pageSize() })
	}

	protected getTemplate(name: string): TemplateRef<unknown> | null {
		return this.templates?.find((template: RegistryTemplateDirective): boolean => template.appTemplate() === name)?.template ?? null
	}
}

import { Component, inject } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { ToastMessageOptions } from 'primeng/api'
import { combineLatest, map, Observable, of } from 'rxjs'
import { GenericModel } from '../../util-model/model/generic.model'
import { PageEventModel } from '../../util-model/model/page-event.model'
import { PageModel } from '../../util-model/model/page.model'
import { GenericComponent } from './generic.component'

@Component( {
    template: '',
} )
export abstract class GenericListComponent<T extends GenericModel> extends GenericComponent {
    protected readonly formBuilder: FormBuilder = inject( FormBuilder )

    protected form: FormGroup = this.formBuilder.group( {} )

    protected readonly loading$: Observable<boolean> = of( false )
    protected readonly error$: Observable<ToastMessageOptions | undefined> = of( undefined )
    protected message: ToastMessageOptions = {
        severity: 'warn', summary: 'warning.title.EMPTY', detail: 'warning.message.EMPTY',
    }

    protected constructor (
        protected readonly elementPage$: Observable<PageModel<T> | undefined> = of( undefined ),
        loading$: Observable<boolean> = of( false ),
        protected readonly silentLoading$: Observable<boolean> = of( false ),
        error$: Observable<ToastMessageOptions | undefined> = of( undefined ),
    ) {
        super()

        this.loading$ = combineLatest( [ loading$, this.contextEventLoading$ ] ).pipe(
            map( ([ loading, contextEventLoading ]: [ boolean, boolean ]): boolean => loading || contextEventLoading ),
        )
        this.error$ = error$

        this.fetchContextEventOnEventIdChange()
    }

    protected changeEmptyMessageTranslationKey (translationKey: string): void {
        const titleKey: string = `warning.title.${translationKey}`
        const title: string = this.translateService.instant( titleKey )
        if (title != titleKey) this.message.summary = title

        const messageKey: string = `warning.message.${translationKey}`
        const message: string = this.translateService.instant( messageKey )
        if (message != messageKey) this.message.detail = message
    }

    protected abstract initForm (): FormGroup

    protected abstract loadPage (pageEvent: PageEventModel, eventId: string | undefined): void
}

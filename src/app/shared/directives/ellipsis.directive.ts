import { Directive, ElementRef, inject } from '@angular/core'

/**
 * Purpose: Ends a text that overflows its container with an ellipsis.
 * Scope: Truncates the host on one line, lets it shrink inside a flex row, and shows the full text as a tooltip once the pointer is over a truncated host.
 * Limits: Does not override a title the host already has; a host that must wrap its text should not use it.
 */
@Directive( {
    selector: '[appEllipsis]',
    host: {
        class: 'block min-w-0 truncate',
        '(mouseenter)': 'syncTitle()',
    },
} )
export class EllipsisDirective {
    private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>( ElementRef ).nativeElement
    private autoTitle: boolean = false

    protected syncTitle (): void {
        const truncated: boolean = this.host.scrollWidth > this.host.clientWidth
        if (truncated && !this.host.title) {
            this.host.title = this.host.textContent?.trim() ?? ''
            this.autoTitle = true
        } else if (!truncated && this.autoTitle) {
            this.host.removeAttribute( 'title' )
            this.autoTitle = false
        }
    }
}

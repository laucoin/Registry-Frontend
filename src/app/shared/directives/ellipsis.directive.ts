import { Directive, ElementRef, inject } from '@angular/core'

/**
 * Purpose: Termine par une ellipse un texte qui déborde de son conteneur.
 * Scope: Tronque l'hôte sur une ligne, le laisse rétrécir dans une ligne flex, et affiche le texte complet en infobulle quand le pointeur survole un hôte tronqué.
 * Limits: N'écrase pas un titre que l'hôte possède déjà ; un hôte dont le texte doit passer à la ligne ne doit pas l'utiliser.
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

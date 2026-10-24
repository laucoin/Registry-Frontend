import { DestroyRef, Directive, effect, ElementRef, inject, input, InputSignal, output, OutputEmitterRef, untracked } from '@angular/core'
import { CommunicationModel } from '@shared/models/model/communication.model'

/**
 * Purpose: Donne à une liste de communications le comportement d'une conversation de messagerie, le dernier message en bas.
 * Scope: Appliqué sous la forme `[appConversationScroll]="communications"` (le plus ancien d'abord) ; défile jusqu'au dernier message quand il change, émet `loadOlder` quand le haut est atteint et garde le lecteur sur le même message une fois des messages plus anciens ajoutés au-dessus.
 * Limits: Ne charge rien ; l'hôte décide s'il existe des messages plus anciens.
 */
@Directive({
    selector: '[appConversationScroll]',
})
export class ConversationScrollDirective {
    private readonly host: HTMLElement = inject( ElementRef<HTMLElement> ).nativeElement
    private readonly sentinel: HTMLElement = document.createElement( 'div' )
    private observer: IntersectionObserver | undefined
    private ready: boolean = false
    private newestId: string | undefined
    private firstId: string | undefined
    private anchor: Element | undefined

    public readonly communications: InputSignal<CommunicationModel[]> = input.required( { alias: 'appConversationScroll' } )
    public readonly loadOlder: OutputEmitterRef<void> = output()

    public constructor () {
        this.sentinel.setAttribute( 'aria-hidden', 'true' )
        this.host.prepend( this.sentinel )

        if (typeof IntersectionObserver !== 'undefined') {
            this.observer = new IntersectionObserver( (entries: IntersectionObserverEntry[]): void => {
                if (this.ready && entries.some( (entry: IntersectionObserverEntry): boolean => entry.isIntersecting )) {
                    this.anchor = this.firstMessage()
                    this.loadOlder.emit()
                }
            } )
            this.observer.observe( this.sentinel )
        }
        inject( DestroyRef ).onDestroy( (): void => this.observer?.disconnect() )

        effect( (): void => {
            const items: CommunicationModel[] = this.communications()
            untracked( (): void => this.settle( items ) )
        } )
    }

    private settle (items: CommunicationModel[]): void {
        const newest: string | undefined = items.at( -1 )?.id
        const first: string | undefined = items[ 0 ]?.id

        setTimeout( (): void => {
            if (newest !== this.newestId) {
                this.newestId = newest
                this.host.lastElementChild?.scrollIntoView( { block: 'end' } )
            } else if (this.anchor && first !== this.firstId) {
                this.anchor.scrollIntoView( { block: 'start' } )
            }
            this.firstId = first
            this.anchor = undefined

            if (items.length > 0) {
                this.ready = true
                // Observer à nouveau signale l'état courant, donc une liste trop courte pour défiler charge quand même les messages plus anciens.
                this.observer?.unobserve( this.sentinel )
                this.observer?.observe( this.sentinel )
            }
        } )
    }

    private firstMessage (): Element | undefined {
        return Array.from( this.host.children ).find( (child: Element): boolean => child !== this.sentinel )
    }
}

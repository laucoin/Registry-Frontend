import { Injectable } from '@angular/core'
import { filter, Observable, Subject } from 'rxjs'

export type CommandEvent = 'create' | 'update' | 'disable' | 'enable' | 'delete' | 'members' | 'status'

interface CommandEventMessage {
    scope: string
    command: CommandEvent
}

/**
 * Purpose: Diffuse des événements de commande entre les facades de routes différentes.
 * Scope: Émet et filtre les événements par portée et commande depuis un subject unique à l'échelle de la racine, car les facades d'éléments sont fournies par route et les écouteurs ne doivent pas dépendre de l'instance de facade qui a exécuté la commande.
 * Limits: Ne porte ni données ni historique.
 */
@Injectable( { providedIn: 'root' } )
export class CommandEventService {
    private readonly events: Subject<CommandEventMessage> = new Subject<CommandEventMessage>()

    public emit (scope: string, command: CommandEvent): void {
        this.events.next( { scope, command } )
    }

    public on (scope: string, ...commands: CommandEvent[]): Observable<CommandEventMessage> {
        return this.events.pipe(
            filter( (event: CommandEventMessage): boolean => event.scope === scope && commands.includes( event.command ) ),
        )
    }
}

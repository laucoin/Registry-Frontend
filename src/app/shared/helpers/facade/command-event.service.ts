import { Injectable } from '@angular/core'
import { filter, Observable, Subject } from 'rxjs'

export type CommandEvent = 'create' | 'update' | 'disable' | 'enable' | 'delete' | 'members' | 'status'

interface CommandEventMessage {
    scope: string
    command: CommandEvent
}

// Root-scoped on purpose: element facades are provided per route (several instances of the same facade
// can coexist), so listeners must not depend on the facade instance that ran the command.
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

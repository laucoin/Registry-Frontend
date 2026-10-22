/**
 * Purpose: Reads the events raised by the web components.
 * Scope: Tells whether an event comes from the element that listens to it and not from a nested one, and reads the value of the field that raised it.
 * Limits: No state; it does not stop the propagation.
 */
export class EventHelper {
    public static isFromHost (event: Event): boolean {
        return event.target === event.currentTarget
    }

    public static valueOf (event: Event): string {
        return (event.target as HTMLElement & { value: string }).value
    }
}

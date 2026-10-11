/**
 * Purpose: Reads the events raised by the web components.
 * Scope: Tells whether an event comes from the element that listens to it and not from a nested one.
 * Limits: No state; it does not stop the propagation.
 */
export class EventHelper {
    public static isFromHost (event: Event): boolean {
        return event.target === event.currentTarget
    }
}

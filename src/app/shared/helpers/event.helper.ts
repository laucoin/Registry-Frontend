/**
 * Purpose: Lit les événements levés par les web components.
 * Scope: Indique si un événement vient de l'élément qui l'écoute et non d'un élément imbriqué, et lit la valeur du champ qui l'a levé.
 * Limits: Aucun état ; n'arrête pas la propagation.
 */
export class EventHelper {
    public static isFromHost (event: Event): boolean {
        return event.target === event.currentTarget
    }

    public static valueOf (event: Event): string {
        return (event.target as HTMLElement & { value: string }).value
    }
}

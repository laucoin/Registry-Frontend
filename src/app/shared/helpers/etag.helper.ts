import { GenericModel } from '@shared/models/model/generic.model'

/**
 * Purpose: Builds the If-Match precondition of an update from the element the user is editing.
 * Scope: Derives the entity tag from the last edition of the element, as the backend does, and turns it into request options.
 * Limits: Sends nothing for an element without last edition; the backend then skips the precondition.
 */
export class ETagHelper {
    public static ifMatch (element: GenericModel | undefined): string | undefined {
        const lastEdition: Date | undefined = element?.lastEdition?.dateTime
        return lastEdition ? `"${new Date( lastEdition ).getTime()}"` : undefined
    }

    public static options (ifMatch: string | undefined): { headers?: Record<string, string> } {
        return ifMatch ? { headers: { 'If-Match': ifMatch } } : {}
    }
}

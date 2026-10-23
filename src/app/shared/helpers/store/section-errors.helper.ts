import { computed, Signal } from '@angular/core'
import { NotificationModel } from '@shared/models/model/notification.model'

type SectionErrors = Record<string, NotificationModel | undefined>

const METADATA_PREFIX: string = 'metadata.'

/**
 * Purpose: Reads the section errors of a store as signals for the facades.
 * Scope: Gives the error of one section, or the errors of the metadata lists keyed by field.
 * Limits: Pure derivations; the fetchers write the errors.
 */
export class SectionErrorsHelper {
    public static of (errors: Signal<SectionErrors>, section: string): Signal<NotificationModel | undefined> {
        return computed( (): NotificationModel | undefined => errors()[ section ] )
    }

    public static metadata (errors: Signal<SectionErrors>): Signal<SectionErrors> {
        return computed( (): SectionErrors => Object.fromEntries(
            Object.entries( errors() )
                .filter( ([ section, error ]: [ string, NotificationModel | undefined ]): boolean => section.startsWith( METADATA_PREFIX ) && error !== undefined )
                .map( ([ section, error ]: [ string, NotificationModel | undefined ]): [ string, NotificationModel | undefined ] => [ section.slice( METADATA_PREFIX.length ), error ] ),
        ) )
    }
}

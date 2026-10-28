import { computed, Signal } from '@angular/core'
import { NotificationModel } from '@shared/models/model/notification.model'

type SectionErrors = Record<string, NotificationModel | undefined>

const METADATA_PREFIX: string = 'metadata.'

/**
 * Purpose: Lit les erreurs de section d'un store sous forme de signals pour les facades.
 * Scope: Donne l'erreur d'une section, ou les erreurs des listes de métadonnées indexées par champ.
 * Limits: Dérivations pures ; les fetchers écrivent les erreurs.
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

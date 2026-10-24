import { StorageUtils } from '@shared/helpers/storage.helper'

/**
 * Purpose: Accès typé au session storage.
 * Scope: Enveloppe les utilitaires de stockage sur sessionStorage.
 * Limits: Pas pour les données sensibles ; les valeurs vivent jusqu'à la fermeture de l'onglet.
 */
export class SessionStorageUtils {
    public static get (key: string): unknown {
        return StorageUtils.get( sessionStorage, key )
    }

    public static check (key: string): boolean {
        return StorageUtils.check( sessionStorage, key )
    }

    public static set (key: string, value: unknown): void {
        StorageUtils.set( sessionStorage, key, value )
    }

    public static delete (key: string): void {
        StorageUtils.delete( sessionStorage, key )
    }

    public static clear (except?: string[]): void {
        StorageUtils.clear( sessionStorage, except )
    }
}

/**
 * Purpose: Vérifications de nullité partagées dans l'application.
 * Scope: Fournit isNull et nonNull.
 * Limits: Rien d'autre ; l'accès au navigateur vit dans le service du navigateur.
 */
export class GenericHelper {
    public static isNull = (value: unknown | undefined | null): boolean => value == undefined
    public static nonNull = (value: unknown | undefined | null): boolean => !this.isNull( value )
}

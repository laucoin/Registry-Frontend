/**
 * What `/authentication/token` returns now that the tokens themselves live in `HttpOnly` cookies.
 *
 * Only the lifetimes: the application cannot read the tokens to inspect their expiry, which is the
 * point — nor can any script that manages to run in this origin.
 */
export interface SessionModel {
    expiresIn: number,
    refreshExpiresIn: number | null,
}

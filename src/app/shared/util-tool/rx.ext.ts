import { defer, Observable } from 'rxjs'

export const initialize =
    (onSubscribe: () => void) =>
    <T>(source: Observable<T>): Observable<T> =>
        defer(() => {
            onSubscribe()
            return source
        })

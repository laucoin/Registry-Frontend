import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

export class GenericHelper {
    public static isNull = (value: unknown | undefined | null): boolean => value == undefined
    public static nonNull = (value: unknown | undefined | null): boolean => !this.isNull( value )
    private static lightThemeQuery: MediaQueryList | undefined

    public static get themeMediaQuery (): MediaQueryList {
        return this.lightThemeQuery ??= window.matchMedia( '(prefers-color-scheme: light)' )
    }

    public static get navigatorTheme (): ThemeEnum {
        return (!window.matchMedia || this.themeMediaQuery.matches) ? ThemeEnum.LIGHT : ThemeEnum.DARK
    }
}

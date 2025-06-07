import { ThemeEnum } from '../../util-model/enumeration/theme.enum'

export class GenericUtil {
    public static isNull = (value: unknown | undefined | null): boolean => value == undefined
    public static nonNull = (value: unknown | undefined | null): boolean => !this.isNull( value )
    public static themeMediaQuery: MediaQueryList = window.matchMedia( '(prefers-color-scheme: light)' )

    public static get navigatorTheme (): ThemeEnum {
        return (!window.matchMedia || this.themeMediaQuery.matches) ? ThemeEnum.LIGHT : ThemeEnum.DARK
    }
}

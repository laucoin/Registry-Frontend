import { ContextConfigModel } from '../model/context-config.model'
import { definePreset } from '@primeng/themes'
import Lara from '@primeng/themes/lara'
import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'

export const sgdfConfig: ContextConfigModel = {
    theme: definePreset( Lara, {
        semantic: {
            primary: {
                '50': '#eef9ff',
                '100': '#dcf4ff',
                '200': '#b2ebff',
                '300': '#6ddcff',
                '400': '#20cbff',
                '500': '#00b5ff',
                '600': '#0091df',
                '700': '#0073b4',
                '800': '#006295',
                '900': '#00507a',
                '950': '#003a5d',
            },
            colorScheme: {
                light: {
                    primary: {
                        color: '#003a5d',
                        inverseColor: '#eef9ff',
                        hoverColor: '#00507a',
                        activeColor: '#006295',
                    },
                    highlight: {
                        background: '#003a5d',
                        focusBackground: '#0073b4',
                        color: '#ffffff',
                        focusColor: '#ffffff',
                    },
                },
                dark: {
                    primary: {
                        color: '#eef9ff',
                        inverseColor: '#003a5d',
                        hoverColor: '#dcf4ff',
                        activeColor: '#b2ebff',
                    },
                    highlight: {
                        background: 'rgba(250, 250, 250, .16)',
                        focusBackground: 'rgba(250, 250, 250, .24)',
                        color: 'rgba(255,255,255,.87)',
                        focusColor: 'rgba(255,255,255,.87)',
                    },
                },
            },
        },
        components: {
            card: {
                colorScheme: {
                    light: {
                        background: '#f8fafc',
                    },
                    dark: {
                        background: '#27272a',
                    },
                },
                body: {
                    padding: '1rem',
                },
            },
            dataview: {
                header: {
                    padding: 0,
                },
            },
            drawer: {
                background: '#003a5d',
                color: '#eef9ff',
                border: {
                    color: 'transparent',
                },
            },
            menu: {
                item: {
                    padding: 0,
                },
            },
            popover: {
                content: {
                    padding: 0,
                },
            },
            tabs: {
                tabpanel: {
                    padding: '1rem 0',
                },
            },
        },
    } ),
    logo: {
        light: 'img/SGDF/logo-white.svg',
        dark: 'img/SGDF/logo-white.svg',
    },
    defaultLanguage: 'fr-FR',
    maintainerEmail: 'laucoin@sgdf.fr',
    user: {
        actions: [
            ElementActionEnum.USER_UPDATE,
            ElementActionEnum.USER_BLOCK,
            ElementActionEnum.USER_UNBLOCK,
            ElementActionEnum.USER_IMPERSONATE,
            ElementActionEnum.USER_DELETE,
        ],
    },
    project: {
        actions: [
            ElementActionEnum.PROJECT_SELECT_PROFILE,
            ElementActionEnum.PROJECT_CREATE_SUPPORT_PROFILE,
            ElementActionEnum.PROJECT_UPDATE,
            ElementActionEnum.PROJECT_DISABLE,
            ElementActionEnum.PROJECT_ENABLE,
            ElementActionEnum.PROJECT_DELETE,
        ],
    },
    projectProfile: {
        actions: [
            ElementActionEnum.PROJECT_PROFILE_SELECT,
            ElementActionEnum.PROJECT_PROFILE_UPDATE,
            ElementActionEnum.PROJECT_PROFILE_BLOCK,
            ElementActionEnum.PROJECT_PROFILE_UNBLOCK,
            ElementActionEnum.PROJECT_PROFILE_DELETE,
        ],
    },
    participant: {
        actions: [
            ElementActionEnum.PARTICIPANT_CONSULT_MOVEMENTS,
            ElementActionEnum.PARTICIPANT_UPDATE,
            ElementActionEnum.PARTICIPANT_DELETE,
            ElementActionEnum.PARTICIPANT_ENABLE,
            ElementActionEnum.PARTICIPANT_REMOVE_FROM_GROUP,
            ElementActionEnum.PARTICIPANT_DELETE,
        ],
    },
    movement: {
        actions: [
            ElementActionEnum.MOVEMENT_CONSULT_COMMUNICATIONS,
            ElementActionEnum.MOVEMENT_UPDATE,
            ElementActionEnum.MOVEMENT_DISABLE,
            ElementActionEnum.MOVEMENT_ENABLE,
            ElementActionEnum.MOVEMENT_DELETE,
        ],
    },
    group: {
        actions: [
            ElementActionEnum.GROUP_CONSULT_MEMBERS,
            ElementActionEnum.GROUP_UPDATE,
            ElementActionEnum.GROUP_DISABLE,
            ElementActionEnum.GROUP_ENABLE,
            ElementActionEnum.GROUP_DELETE,
        ],
    },
    vehicle: {
        actions: [
            ElementActionEnum.VEHICLE_CONSULT_MOVEMENTS,
            ElementActionEnum.VEHICLE_UPDATE,
            ElementActionEnum.VEHICLE_DISABLE,
            ElementActionEnum.VEHICLE_ENABLE,
            ElementActionEnum.VEHICLE_DELETE,
        ],
    },
    activity: {
        actions: [
            ElementActionEnum.ACTIVITY_CONSULT_MOVEMENTS,
            ElementActionEnum.ACTIVITY_UPDATE,
            ElementActionEnum.ACTIVITY_DISABLE,
            ElementActionEnum.ACTIVITY_ENABLE,
            ElementActionEnum.ACTIVITY_DELETE,
        ],
    },
    communication: {
        actions: [
            ElementActionEnum.COMMUNICATION_UPDATE,
            ElementActionEnum.COMMUNICATION_DISABLE,
            ElementActionEnum.COMMUNICATION_ENABLE,
            ElementActionEnum.COMMUNICATION_DELETE,
        ],
    },
    notification: {
        duration: {
            info: 5000,
            success: 3000,
            warn: 8000,
            error: 15000,
            secondary: 5000,
            contrast: 5000,
        },
    },
}

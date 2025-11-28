import type { UXP_Manifest, UXP_Config } from 'vite-uxp-plugin'
import { version } from './package.json'

const extraPrefs = {
    hotReloadPort: 8080,
    webviewUi: true,
    webviewReloadPort: 8082,
    copyZipAssets: ['public-zip/*']
}

export const id = 'games.breadknife.fireanimation'
const name = 'Fire Animation'

const manifest: UXP_Manifest = {
    id,
    name,
    version,
    main: 'index.html',
    manifestVersion: 6,
    host: [
        {
            app: 'PS',
            minVersion: '24.2.0'
        }
    ],
    entrypoints: [
        {
            type: 'panel',
            id: `${id}.timeline`,
            label: {
                default: 'Fire Timeline 🔥'
            },
            minimumSize: { width: 230, height: 200 },
            maximumSize: { width: 2000, height: 2000 },
            preferredDockedSize: { width: 230, height: 300 },
            preferredFloatingSize: { width: 450, height: 400 },
            icons: [
                {
                    width: 23,
                    height: 23,
                    path: 'icons/dark.png',
                    scale: [1, 2],
                    theme: ['darkest', 'dark', 'medium']
                },
                {
                    width: 23,
                    height: 23,
                    path: 'icons/light.png',
                    scale: [1, 2],
                    theme: ['lightest', 'light']
                }
            ]
        },
        {
            type: 'panel',
            id: `${id}.preview`,
            label: {
                default: 'Fire Preview 🔥'
            },
            minimumSize: { width: 230, height: 200 },
            maximumSize: { width: 2000, height: 2000 },
            preferredDockedSize: { width: 230, height: 300 },
            preferredFloatingSize: { width: 450, height: 400 },
            icons: [
                {
                    width: 23,
                    height: 23,
                    path: 'icons/dark.png',
                    scale: [1, 2],
                    theme: ['darkest', 'dark', 'medium']
                },
                {
                    width: 23,
                    height: 23,
                    path: 'icons/light.png',
                    scale: [1, 2],
                    theme: ['lightest', 'light']
                }
            ]
        },
        {
            type: 'command',
            id: 'previousFrame',
            label: {
                default: 'Previous Frame'
            }
        },
        {
            type: 'command',
            id: 'nextFrame',
            label: {
                default: 'Next Frame'
            }
        },
        {
            type: 'command',
            id: 'playPause',
            label: {
                default: 'Play/Pause Preview'
            }
        },
        {
            type: 'command',
            id: 'playStop',
            label: {
                default: 'Play/Stop Preview'
            }
        }
    ],
    featureFlags: {
        enableAlerts: true
    },
    requiredPermissions: {
        localFileSystem: 'fullAccess',
        launchProcess: {
            schemes: ['https', 'slack', 'file', 'ws'],
            extensions: ['.xd', '.psd', '.bat', '.cmd', '']
        },
        network: {
            domains: [
                'https://hyperbrew.co',
                'https://github.com',
                'https://vitejs.dev',
                'https://svelte.dev',
                'https://reactjs.org',
                'https://vuejs.org/',
                `ws://localhost:${extraPrefs.hotReloadPort}` // Required for hot reload
            ]
        },
        clipboard: 'readAndWrite',
        webview: {
            allow: 'yes',
            allowLocalRendering: 'yes',
            domains: 'all',
            enableMessageBridge: 'localAndRemote'
        },
        ipc: {
            enablePluginCommunication: true
        },
        allowCodeGenerationFromStrings: true
    },
    icons: [
        {
            width: 48,
            height: 48,
            path: 'icons/plugin-icon.png',
            scale: [1, 2],
            theme: ['darkest', 'dark', 'medium', 'lightest', 'light', 'all'],
            species: ['pluginList']
        }
    ]
}

export const config: UXP_Config = {
    manifest,
    ...extraPrefs
}

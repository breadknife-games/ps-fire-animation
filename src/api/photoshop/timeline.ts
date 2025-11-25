import { photoshop as ps } from '../../globals'
import { ActionTarget } from './action'

interface Timecode {
    _obj: 'timecode'
    seconds: number
    frame: number
    frameRate: number
}

export class Timeline {
    static _target = new ActionTarget([
        { _ref: 'timeline', _enum: 'ordinal', _value: 'targetEnum' }
    ])

    static get enabled(): boolean {
        return this._target.getProperty<boolean>('enabled')
    }

    static async createVideoTimeline(): Promise<void> {
        await ps.core.executeAsModal(
            async () => {
                await ps.action.batchPlay(
                    [
                        {
                            _obj: 'makeTimeline',
                            _isCommand: true
                        }
                    ],
                    {}
                )
            },
            { commandName: 'Create video timeline' }
        )
    }

    static getCurrentTime(): Timecode {
        return this._target.getProperty<Timecode>('time')
    }

    static async setCurrentTime(frame: number) {
        const time = this.getCurrentTime()
        await ps.core.executeAsModal(
            async () => {
                await ps.action.batchPlay(
                    [
                        {
                            _obj: 'set',
                            _target: [
                                { _ref: 'property', _property: 'time' },
                                { _ref: 'timeline' }
                            ],
                            to: {
                                _obj: 'timecode',
                                seconds: 0,
                                frame: frame,
                                frameRate: time.frameRate
                            }
                        }
                    ],
                    {}
                )
            },
            { commandName: 'Set current time' }
        )
    }

    static async toggleOnionSkin() {
        await ps.core.executeAsModal(
            async () => {
                const res = await ps.action.batchPlay(
                    [
                        {
                            _obj: 'select',
                            _target: [
                                {
                                    _ref: 'menuItemClass',
                                    _enum: 'menuItemType',
                                    _value: 'timelineEnableOnionSkins'
                                }
                            ]
                        }
                    ],
                    {}
                )
                console.log(res)
            },
            { commandName: 'Toggle onion skin' }
        )
    }

    static async openOnionSkinSettings() {
        await ps.core.executeAsModal(
            async () => {
                await ps.action.batchPlay(
                    [
                        {
                            _obj: 'select',
                            _target: [
                                {
                                    _ref: 'menuItemClass',
                                    _enum: 'menuItemType',
                                    _value: 'timelineOnionSkinSettings'
                                }
                            ]
                        }
                    ],
                    {}
                )
            },
            { commandName: 'Open onion skin settings' }
        )
    }

    /**
     * Normalize a frame to be exactly 1 frame long, positioned right after the previous frame.
     * Call this once for each frame in order (first to last).
     * Steps: select, moveInTime -9999, moveOutTime -9999
     */
    static async normalizeFrame(layerId: number): Promise<void> {
        const time = this.getCurrentTime()
        console.log(`[Timeline.normalizeFrame] Normalizing frame ${layerId}`)

        try {
            await ps.core.executeAsModal(
                async () => {
                    // Select, moveInTime -9999, moveOutTime -9999
                    await ps.action.batchPlay(
                        [
                            {
                                _obj: 'select',
                                _target: [{ _ref: 'layer', _id: layerId }],
                                layerID: [layerId]
                            },
                            {
                                _obj: 'moveInTime',
                                timeOffset: {
                                    _obj: 'timecode',
                                    seconds: 0,
                                    frame: -9999,
                                    frameRate: time.frameRate
                                }
                            },
                            {
                                _obj: 'moveOutTime',
                                timeOffset: {
                                    _obj: 'timecode',
                                    seconds: 0,
                                    frame: -9999,
                                    frameRate: time.frameRate
                                }
                            }
                        ],
                        {}
                    )
                },
                { commandName: 'Normalize frame' }
            )
            console.log(
                `[Timeline.normalizeFrame] Successfully normalized frame ${layerId}`
            )
        } catch (error) {
            console.error(
                `[Timeline.normalizeFrame] Error normalizing frame ${layerId}:`,
                error
            )
            throw error
        }
    }

    /**
     * Set a layer to span a specific length starting from frame 0.
     * Steps: select, moveInTime -9999, moveOutTime -9999, moveOutTime +length
     */
    static async setLayerLength(
        layerId: number,
        length: number
    ): Promise<void> {
        const time = this.getCurrentTime()
        console.log(
            `[Timeline.setLayerLength] Setting layer ${layerId} to length ${length}`
        )

        try {
            await ps.core.executeAsModal(
                async () => {
                    // Select, moveInTime -9999, moveOutTime -9999, moveOutTime +length
                    await ps.action.batchPlay(
                        [
                            {
                                _obj: 'select',
                                _target: [{ _ref: 'layer', _id: layerId }],
                                layerID: [layerId]
                            },
                            {
                                _obj: 'moveInTime',
                                timeOffset: {
                                    _obj: 'timecode',
                                    seconds: 0,
                                    frame: -9999,
                                    frameRate: time.frameRate
                                }
                            },
                            {
                                _obj: 'moveOutTime',
                                timeOffset: {
                                    _obj: 'timecode',
                                    seconds: 0,
                                    frame: -9999,
                                    frameRate: time.frameRate
                                }
                            },
                            {
                                _obj: 'moveOutTime',
                                timeOffset: {
                                    _obj: 'timecode',
                                    seconds: 0,
                                    frame: length - 1,
                                    frameRate: time.frameRate
                                }
                            }
                        ],
                        {}
                    )
                },
                { commandName: 'Set layer length' }
            )
            console.log(
                `[Timeline.setLayerLength] Successfully set layer ${layerId} to length ${length}`
            )
        } catch (error) {
            console.error(
                `[Timeline.setLayerLength] Error setting layer ${layerId} length:`,
                error
            )
            throw error
        }
    }
}

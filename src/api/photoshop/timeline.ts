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
}

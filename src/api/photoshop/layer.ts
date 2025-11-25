import { photoshop as ps } from '../../globals'
import { ActionTarget } from './action'
import { FireDocument } from './document'

export enum PSLayerKind {
    Pixel = 1,
    Group = 7,
    GroupEnd = 13
}

export const psLayerProperties = [
    'layerID',
    'name',
    'visible',
    'color',
    'layerKind',
    'parentLayerID',
    'layerSectionExpanded'
]

export interface PSLayer {
    layerID: number
    name: string
    visible: boolean
    color: {
        _enum: 'string'
        _value: string
    }
    layerKind: number
    parentLayerID: number
    layerSectionExpanded: boolean
}

export enum FireLayerType {
    Group = 'group',
    Layer = 'layer',
    Video = 'video',
    Unknown = 'unknown'
}

export interface FireLayerColor {
    value: string
    name: string
    hex: string
}

export interface FireLayerTrimmedImageData {
    x: number
    y: number
    width: number
    height: number
    fullWidth: number
    fullHeight: number
}

export interface FireLayerTrimmedBase64ImageData
    extends FireLayerTrimmedImageData {
    base64: string
}

export interface FireLayerTrimmedUint8ArrayImageData
    extends FireLayerTrimmedImageData {
    data: Uint8Array
}

export const layerColors = {
    none: { value: 'none', name: 'None', hex: '' },
    red: { value: 'red', name: 'Red', hex: '#8d2d2c' },
    orange: { value: 'orange', name: 'Orange', hex: '#935201' },
    yellowColor: { value: 'yellowColor', name: 'Yellow', hex: '#957c00' },
    grain: { value: 'grain', name: 'Green', hex: '#3f6334' },
    seafoam: { value: 'seafoam', name: 'Seafoam', hex: '#006662' },
    blue: { value: 'blue', name: 'Blue', hex: '#3e4f85' },
    indigo: { value: 'indigo', name: 'Indigo', hex: '#3236a7' },
    magenta: { value: 'magenta', name: 'Magenta', hex: '#a92f64' },
    fuchsia: { value: 'fuchsia', name: 'Fuchsia', hex: '#852487' },
    violet: { value: 'violet', name: 'Violet', hex: '#5d4681' },
    gray: { value: 'gray', name: 'Gray', hex: '#535353' }
}

export class FireLayer {
    public readonly id: number
    public readonly name: string
    public readonly selected: boolean
    public readonly visible: boolean
    public readonly type: FireLayerType
    public readonly color: FireLayerColor
    public readonly expanded: boolean
    public readonly children: ReadonlyArray<FireLayer>

    private _target: ActionTarget

    constructor(
        public readonly document: FireDocument,
        public readonly parent: FireLayer | null,
        layer: PSLayer,
        allLayers: PSLayer[],
        selectedLayerIds: number[]
    ) {
        this.children = allLayers
            .filter(
                l =>
                    l.parentLayerID === layer.layerID &&
                    l.layerKind !== PSLayerKind.GroupEnd
            )
            .map(
                l =>
                    new FireLayer(
                        document,
                        this,
                        l,
                        allLayers,
                        selectedLayerIds
                    )
            )

        this.id = layer.layerID
        this.name = layer.name
        this.selected = selectedLayerIds.includes(layer.layerID)
        this.visible = layer.visible
        this.expanded = layer.layerSectionExpanded

        // Photoshop doesn't tell you if a group is a video group...
        if (layer.layerKind === PSLayerKind.Pixel) {
            this.type = FireLayerType.Layer
        } else if (layer.layerKind === PSLayerKind.Group) {
            if (this.children.every(l => l.type === FireLayerType.Layer)) {
                this.type = FireLayerType.Video
            } else {
                this.type = FireLayerType.Group
            }
        } else {
            this.type = FireLayerType.Unknown
        }

        this.color =
            Object.values(layerColors).find(
                c => c.value === layer.color._value
            ) ?? layerColors.none

        this._target = ActionTarget.fromLayer(this.id)
    }

    async select() {
        await this.document.suspendHistory(async () => {
            await ps.action.batchPlay(
                [
                    {
                        _obj: 'select',
                        _target: [
                            {
                                _ref: 'layer',
                                _id: this.id
                            }
                        ],
                        layerID: [this.id]
                    }
                ],
                {}
            )
        }, 'Select Layer')
    }

    async setVisible(value: boolean) {
        await this.document.suspendHistory(async () => {
            await ps.action.batchPlay(
                [
                    {
                        _obj: value ? 'show' : 'hide',
                        null: [
                            {
                                _ref: 'layer',
                                _id: this.id
                            }
                        ]
                    }
                ],
                {}
            )
        }, 'Set Layer Visibility')
    }

    async setColor(colorValue: string) {
        await this.document.suspendHistory(async () => {
            await ps.action.batchPlay(
                [
                    {
                        _obj: 'set',
                        _target: [
                            {
                                _ref: 'layer',
                                _id: this.id
                            }
                        ],
                        to: {
                            _obj: 'layer',
                            color: {
                                _enum: 'color',
                                _value: colorValue
                            }
                        }
                    }
                ],
                {}
            )
        }, 'Set Layer Color')
    }

    async getBase64ImageData(
        width: number,
        height: number
    ): Promise<FireLayerTrimmedBase64ImageData> {
        console.log('THE EXECUTE AS MODAL IS BEING CALLED')
        return ps.core.executeAsModal(
            async () => {
                let imageObj
                try {
                    imageObj = await ps.imaging.getPixels({
                        layerID: this.id,
                        targetSize: { width, height },
                        componentSize: 8,
                        applyAlpha: true
                    })
                } catch (e) {
                    // If there are no pixels in the area, this will throw
                    return {
                        base64: '',
                        x: 0,
                        y: 0,
                        width: 0,
                        height: 0,
                        fullWidth: 0,
                        fullHeight: 0
                    }
                }

                const base64 = (await ps.imaging.encodeImageData({
                    imageData: imageObj.imageData,
                    base64: true
                })) as string

                await imageObj.imageData.dispose()

                return {
                    base64,
                    x: imageObj.sourceBounds.left,
                    y: imageObj.sourceBounds.top,
                    width:
                        imageObj.sourceBounds.right -
                        imageObj.sourceBounds.left,
                    height:
                        imageObj.sourceBounds.bottom -
                        imageObj.sourceBounds.top,
                    fullWidth:
                        this.document.width / Math.pow(2, imageObj.level),
                    fullHeight:
                        this.document.height / Math.pow(2, imageObj.level)
                }
            },
            { commandName: 'getLayerImageData' }
        )
    }

    async getUint8ArrayImageData(
        width: number,
        height: number
    ): Promise<FireLayerTrimmedUint8ArrayImageData> {
        return ps.core.executeAsModal(
            async () => {
                let imageObj
                try {
                    imageObj = await ps.imaging.getPixels({
                        layerID: this.id,
                        targetSize: { width, height },
                        componentSize: 8,
                        applyAlpha: false
                    })
                } catch (e) {
                    // If there are no pixels in the area, this will throw
                    return {
                        data: new Uint8Array(),
                        x: 0,
                        y: 0,
                        width: 0,
                        height: 0,
                        fullWidth: 0,
                        fullHeight: 0
                    }
                }

                const data = (await imageObj.imageData.getData({
                    chunky: true
                })) as Uint8Array

                await imageObj.imageData.dispose()

                return {
                    data,
                    x: imageObj.sourceBounds.left,
                    y: imageObj.sourceBounds.top,
                    width:
                        imageObj.sourceBounds.right -
                        imageObj.sourceBounds.left,
                    height:
                        imageObj.sourceBounds.bottom -
                        imageObj.sourceBounds.top,
                    fullWidth:
                        this.document.width / Math.pow(2, imageObj.level),
                    fullHeight:
                        this.document.height / Math.pow(2, imageObj.level)
                }
            },
            { commandName: 'getLayerImageData' }
        )
    }
}

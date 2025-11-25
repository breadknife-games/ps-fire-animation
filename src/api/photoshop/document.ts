import { photoshop as ps } from '../../globals'
import type { Document } from 'photoshop/dom/Document'
import { FireLayer, psLayerProperties } from './layer'
import type { PSLayer } from './layer'
import type { ActionDescriptor } from 'photoshop/dom/CoreModules'

export class FireDocument {
    public readonly id: number
    public readonly width: number
    public readonly height: number

    constructor(public readonly psDocument: Document) {
        this.id = psDocument.id
        this.width = psDocument.width
        this.height = psDocument.height
    }

    static fromId(id: number) {
        const psDocument = ps.app.documents.filter(doc => doc.id === id)?.[0]
        if (!psDocument) throw new Error(`Document with id ${id} not found`)
        return new FireDocument(psDocument)
    }

    static get current() {
        return new FireDocument(ps.app.activeDocument)
    }

    get currentLayerId() {
        return this.psDocument.activeLayers[0]?.id
    }

    getSelectedLayerIds() {
        return this.psDocument.activeLayers.map(layer => layer.id)
    }

    private getLayerWithoutChildren(
        selectedLayerIds: number[],
        id: number
    ): FireLayer {
        const res = ps.action.batchPlay(
            [
                {
                    _obj: 'multiGet',
                    _target: [
                        {
                            _ref: 'layer',
                            _id: id
                        }
                    ],
                    extendedReference: [psLayerProperties]
                }
            ],
            {
                synchronousExecution: true
            }
        ) as unknown as PSLayer[]

        return new FireLayer(this, null, res[0], [], selectedLayerIds)
    }

    getLayers(): FireLayer[] {
        const selections = this.getSelectedLayerIds()
        const res = ps.action.batchPlay(
            [
                {
                    _obj: 'multiGet',
                    _target: [
                        {
                            _ref: 'document',
                            _id: FireDocument.current.id
                        }
                    ],
                    extendedReference: [
                        psLayerProperties,
                        {
                            _obj: 'layer',
                            index: 1,
                            count: -1
                        }
                    ],
                    options: {
                        failOnMissingProperty: false,
                        failOnMissingElement: true
                    }
                }
            ],
            {
                synchronousExecution: true
            }
        ) as unknown as ActionDescriptor[]

        const allLayers = (res[0].list as PSLayer[]).reverse()
        const rootLayers = allLayers.filter(layer => layer.parentLayerID === -1)
        return rootLayers.map(
            layer => new FireLayer(this, null, layer, allLayers, selections)
        )
    }

    async createFrame(using: any = {}): Promise<FireLayer> {
        await this.psDocument.suspendHistory(async () => {
            await ps.action.batchPlay(
                [
                    {
                        _obj: 'make',
                        _target: [{ _ref: 'layer' }],
                        using
                    },
                    {
                        _obj: 'moveOutTime',
                        timeOffset: {
                            _obj: 'timecode',
                            frame: -9999,
                            frameRate: 0,
                            seconds: 0
                        }
                    }
                ],
                {}
            )
        }, 'Create Layer')

        const selections = this.getSelectedLayerIds()
        return this.getLayerWithoutChildren(selections, selections[0])
    }

    async duplicateLayer(layer: FireLayer): Promise<FireLayer> {
        await this.psDocument.suspendHistory(async () => {
            await ps.action.batchPlay(
                [
                    {
                        _obj: 'duplicate',
                        _target: [
                            {
                                _ref: 'layer',
                                _id: layer.id
                            }
                        ]
                    }
                ],
                {}
            )
        }, 'Duplicate Layer')

        const selections = this.getSelectedLayerIds()
        return this.getLayerWithoutChildren(selections, selections[0])
    }

    get canvasSize() {
        return {
            width: this.psDocument.width,
            height: this.psDocument.height
        }
    }

    get aspectRatio() {
        return this.canvasSize.width / this.canvasSize.height
    }

    async suspendHistory<T = void>(
        fn: () => Promise<T> | T,
        name: string
    ): Promise<T> {
        let result: T
        await this.psDocument.suspendHistory(async () => {
            result = await fn()
        }, name)
        return result!
    }
}

import { photoshop as ps } from '../../globals'
import type { Document } from 'photoshop/dom/Document'
import { FireLayer, psLayerProperties } from './layer'
import type { PSLayer } from './layer'
import type { ActionDescriptor } from 'photoshop/dom/CoreModules'

// Import UXP XMP API
const uxp = require('uxp')
const { XMPMeta } = uxp.xmp

// Custom namespace for Fire Animation plugin
const FIRE_NAMESPACE = 'ps-fire-animation'
const FIRE_PREFIX = 'fire'

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
        }, 'Create Frame')

        const selections = this.getSelectedLayerIds()
        return this.getLayerWithoutChildren(selections, selections[0])
    }

    async duplicateLayer(layer: FireLayer): Promise<FireLayer> {
        // Collect all layer colors and names before duplicating (including children)
        // Store colors in a tree structure matching the layer hierarchy
        type ColorTree = {
            color: string
            name: string
            children: ColorTree[]
        }
        const collectColorsAndNames = (l: FireLayer): ColorTree => {
            return {
                color: l.color.value,
                name: l.name,
                children: l.children.map(child =>
                    collectColorsAndNames(child as FireLayer)
                )
            }
        }
        const originalColorTree = collectColorsAndNames(layer)

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
        const duplicated = this.getLayerWithoutChildren(
            selections,
            selections[0]
        )

        // Restore colors for the duplicated layer and all its children
        // We need to get the full layer tree after duplication to restore all children
        const allLayersAfter = this.getLayers()
        const findDuplicatedLayer = (
            layers: FireLayer[],
            targetId: number
        ): FireLayer | null => {
            for (const l of layers) {
                if (l.id === targetId) return l
                if (l.children.length > 0) {
                    const found = findDuplicatedLayer(
                        l.children as FireLayer[],
                        targetId
                    )
                    if (found) return found
                }
            }
            return null
        }

        const duplicatedFull = findDuplicatedLayer(
            allLayersAfter,
            duplicated.id
        )
        if (duplicatedFull) {
            // Collect all color and name restoration actions
            const restoreActions: any[] = []
            const collectRestoreActions = (
                l: FireLayer,
                colorTree: ColorTree,
                isTopLevel: boolean = false
            ) => {
                // Restore color
                restoreActions.push({
                    _obj: 'set',
                    _target: [
                        {
                            _ref: 'layer',
                            _id: l.id
                        }
                    ],
                    to: {
                        _obj: 'layer',
                        color: {
                            _enum: 'color',
                            _value: colorTree.color
                        }
                    }
                })

                // Restore name - for top level, add "copy" suffix; for children, restore original name
                const nameToSet = isTopLevel
                    ? `${colorTree.name} copy`
                    : colorTree.name

                restoreActions.push({
                    _obj: 'set',
                    _target: [
                        {
                            _ref: 'layer',
                            _id: l.id
                        }
                    ],
                    to: {
                        _obj: 'layer',
                        name: nameToSet
                    }
                })

                const children = l.children as FireLayer[]
                for (
                    let i = 0;
                    i < Math.min(children.length, colorTree.children.length);
                    i++
                ) {
                    collectRestoreActions(
                        children[i],
                        colorTree.children[i],
                        false
                    )
                }
            }
            collectRestoreActions(duplicatedFull, originalColorTree, true)

            if (restoreActions.length > 0) {
                await this.psDocument.suspendHistory(async () => {
                    await ps.action.batchPlay(restoreActions, {})
                }, 'Restore Layer Colors and Names')
            }
        }

        return duplicated
    }

    async deleteLayer(layer: FireLayer): Promise<void> {
        await this.psDocument.suspendHistory(async () => {
            await ps.action.batchPlay(
                [
                    {
                        _obj: 'delete',
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
        }, 'Delete Layer')
    }

    /**
     * Create a new empty pixel layer
     * @param name - Optional name for the layer
     * @returns The newly created layer
     */
    async createLayer(name?: string): Promise<FireLayer> {
        await this.psDocument.suspendHistory(async () => {
            await ps.action.batchPlay(
                [
                    {
                        _obj: 'make',
                        _target: [{ _ref: 'layer' }],
                        ...(name ? { using: { _obj: 'layer', name } } : {})
                    }
                ],
                {}
            )
        }, 'Create Layer')

        const selections = this.getSelectedLayerIds()
        return this.getLayerWithoutChildren(selections, selections[0])
    }

    /**
     * Create a new empty group (folder)
     * @param name - Optional name for the group
     * @returns The newly created group layer
     */
    async createGroup(name?: string): Promise<FireLayer> {
        await this.psDocument.suspendHistory(async () => {
            await ps.action.batchPlay(
                [
                    {
                        _obj: 'make',
                        _target: [{ _ref: 'layerSection' }],
                        ...(name ? { name } : {})
                    }
                ],
                {}
            )
        }, 'Create Group')

        const selections = this.getSelectedLayerIds()
        return this.getLayerWithoutChildren(selections, selections[0])
    }

    /**
     * Create a new video group with a default empty frame inside
     * @param name - Optional name for the video group
     * @returns The newly created video group layer
     */
    async createVideoGroup(name?: string): Promise<FireLayer> {
        let videoGroupId: number | null = null

        await this.psDocument.suspendHistory(async () => {
            const time = ps.action.batchPlay(
                [
                    {
                        _obj: 'get',
                        _target: [
                            { _ref: 'property', _property: 'time' },
                            { _ref: 'timeline' }
                        ]
                    }
                ],
                { synchronousExecution: true }
            ) as unknown as { time: { frameRate: number } }[]
            const frameRate = time[0]?.time?.frameRate || 30

            // First create the sceneSection (video group)
            const result = (await ps.action.batchPlay(
                [
                    {
                        _obj: 'make',
                        _target: [{ _ref: 'sceneSection' }],
                        ...(name ? { name } : {})
                    }
                ],
                {}
            )) as { layerID?: number }[]

            videoGroupId = result[0]?.layerID ?? this.getSelectedLayerIds()[0]

            // Create an empty frame layer inside and normalize it
            await ps.action.batchPlay(
                [
                    {
                        _obj: 'make',
                        _target: [{ _ref: 'layer' }]
                    },
                    {
                        _obj: 'moveInTime',
                        timeOffset: {
                            _obj: 'timecode',
                            frame: -9999,
                            frameRate,
                            seconds: 0
                        }
                    },
                    {
                        _obj: 'moveOutTime',
                        timeOffset: {
                            _obj: 'timecode',
                            frame: -9999,
                            frameRate,
                            seconds: 0
                        }
                    }
                ],
                {}
            )
        }, 'Create Video Group')

        const selections = this.getSelectedLayerIds()
        const selectedId = videoGroupId ?? selections[0]
        return this.getLayerWithoutChildren(selections, selectedId)
    }

    /**
     * Move a layer to a new position relative to a target layer
     * @param layerId - The layer to move
     * @param targetLayerId - The reference layer for placement
     * @param position - Where to place relative to target: 'above', 'below', or 'inside' (for groups)
     */
    async moveLayer(
        layerId: number,
        targetLayerId: number,
        position: 'above' | 'below' | 'inside'
    ): Promise<void> {
        const findLayerById = (layers: any[], id: number): any | null => {
            for (const layer of layers) {
                if (layer.id === id) return layer
                if (layer.layers) {
                    const found = findLayerById(layer.layers, id)
                    if (found) return found
                }
            }
            return null
        }

        await ps.core.executeAsModal(
            async () => {
                const doc = this.psDocument
                const layerToMove = findLayerById([...doc.layers], layerId)
                const targetLayer = findLayerById(
                    [...doc.layers],
                    targetLayerId
                )

                if (!layerToMove || !targetLayer) {
                    console.error('Layer not found', { layerId, targetLayerId })
                    return
                }

                console.log('Moving layer', {
                    layerId,
                    targetLayerId,
                    position,
                    layerName: layerToMove.name,
                    targetName: targetLayer.name,
                    targetKind: targetLayer.kind,
                    targetHasLayers: !!targetLayer.layers
                })

                if (position === 'inside') {
                    // Move layer into a group using PLACEINSIDE
                    console.log('Moving inside group using PLACEINSIDE')
                    layerToMove.move(
                        targetLayer,
                        ps.constants.ElementPlacement.PLACEINSIDE
                    )
                } else if (position === 'above') {
                    // Move layer above target
                    layerToMove.move(
                        targetLayer,
                        ps.constants.ElementPlacement.PLACEBEFORE
                    )
                } else {
                    // Move layer below target
                    layerToMove.move(
                        targetLayer,
                        ps.constants.ElementPlacement.PLACEAFTER
                    )
                }
            },
            { commandName: 'Move Layer' }
        )
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

    /**
     * Get XMP property from document metadata
     * @param propertyName - The property name in the Fire namespace
     * @returns The property value, or null if not found
     */
    getXmpData(propertyName: string): string | null {
        try {
            // Get XMP metadata from document
            const result = ps.action.batchPlay(
                [
                    {
                        _obj: 'get',
                        _target: [
                            {
                                _ref: 'property',
                                _property: 'XMPMetadataAsUTF8'
                            },
                            { _ref: 'document', _id: this.id }
                        ]
                    }
                ],
                { synchronousExecution: true }
            ) as unknown as { XMPMetadataAsUTF8?: string }[]

            const xmpString = result[0]?.XMPMetadataAsUTF8

            if (xmpString) {
                // Parse XMP using UXP XMP API
                const xmpMeta = new XMPMeta(xmpString)

                // Register our custom namespace
                XMPMeta.registerNamespace(FIRE_NAMESPACE, FIRE_PREFIX)

                // Try to get the property
                if (xmpMeta.doesPropertyExist(FIRE_NAMESPACE, propertyName)) {
                    const property = xmpMeta.getProperty(
                        FIRE_NAMESPACE,
                        propertyName
                    )
                    return property.value
                }
            }
        } catch (error) {
            console.error(
                `Failed to get XMP property "${propertyName}":`,
                error
            )
        }

        return null
    }

    /**
     * Set XMP property in document metadata
     * @param propertyName - The property name in the Fire namespace
     * @param value - The property value to set
     */
    async setXmpData(propertyName: string, value: string): Promise<void> {
        try {
            await ps.core.executeAsModal(
                async () => {
                    // Get current XMP metadata
                    const result = ps.action.batchPlay(
                        [
                            {
                                _obj: 'get',
                                _target: [
                                    {
                                        _ref: 'property',
                                        _property: 'XMPMetadataAsUTF8'
                                    },
                                    { _ref: 'document', _id: this.id }
                                ]
                            }
                        ],
                        { synchronousExecution: true }
                    ) as unknown as { XMPMetadataAsUTF8?: string }[]

                    const xmpString = result[0]?.XMPMetadataAsUTF8 || ''

                    // Create or parse XMP metadata
                    const xmpMeta = xmpString
                        ? new XMPMeta(xmpString)
                        : new XMPMeta()

                    // Register our custom namespace
                    XMPMeta.registerNamespace(FIRE_NAMESPACE, FIRE_PREFIX)

                    // Set the property
                    xmpMeta.setProperty(FIRE_NAMESPACE, propertyName, value)

                    // Serialize back to string
                    const updatedXmpString = xmpMeta.serialize()

                    // Set the updated XMP back to the document
                    ps.action.batchPlay(
                        [
                            {
                                _obj: 'set',
                                _target: [
                                    {
                                        _ref: 'property',
                                        _property: 'XMPMetadataAsUTF8'
                                    },
                                    { _ref: 'document', _id: this.id }
                                ],
                                to: {
                                    _obj: 'document',
                                    XMPMetadataAsUTF8: updatedXmpString
                                }
                            }
                        ],
                        { synchronousExecution: true }
                    )
                },
                { commandName: 'Update Metadata' }
            )
        } catch (error) {
            console.error(
                `Failed to set XMP property "${propertyName}":`,
                error
            )
            throw error
        }
    }
}

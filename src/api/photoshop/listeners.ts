import { photoshop as ps } from '../../globals'

interface ToolModalStateChangedDescriptor {
    state: {
        _value: 'enter' | 'exit'
    }
    kind: {
        _value: 'paint'
    }
}

interface HistoryStateChangedDescriptor {
    ID: number
}

interface SelectDescriptor {
    _obj: 'select'
    _target: {
        _ref: 'layer' | 'document'
    }[]
    layerID?: number[]
    documentID?: number
}

interface SetTimelineTimeDescriptor {
    to: { _obj: string; seconds: number; frame: number; frameRate: number }
}

interface HideDescriptor {
    _obj: 'hide'
    null: {
        _ref: string
        _name: string
    }[]
}

interface ShowDescriptor {
    _obj: 'show'
    null: {
        _ref: string
        _name: string
    }[]
}

interface CloseDescriptor {
    _obj: 'close'
    documentID: number
}

interface NewDocumentDescriptor {
    _obj: 'newDocument'
    documentID: number
}

interface MakeDescriptor {
    _obj: 'make'
    layerID?: number
    new?: {
        _obj: string
    }
}

interface MoveDescriptor {
    _obj: 'move'
    _target?: {
        _ref: string
    }[]
}

interface DeleteDescriptor {
    _obj: 'delete'
    _target?: {
        _ref: string
    }[]
}

async function addListener<T>(
    event: string,
    callback: (descriptor: T) => void
) {
    await ps.action.addNotificationListener([event], (event, descriptor) => {
        callback(descriptor as T)
    })
}

export class FireListeners {
    private static historyStateListeners: (() => void)[] = []
    private static selectListeners: ((layerId: number[]) => void)[] = []

    static invokeHistoryStateListeners() {
        for (const listener of this.historyStateListeners) listener()
    }

    static invokeSelectListeners(layerId: number[]) {
        for (const listener of this.selectListeners) listener(layerId)
    }

    static async addPaintEndListener(callback: () => void): Promise<void> {
        await addListener<ToolModalStateChangedDescriptor>(
            'toolModalStateChanged',
            descriptor => {
                if (
                    descriptor.state._value === 'exit' &&
                    descriptor.kind._value === 'paint'
                )
                    callback()
            }
        )
    }

    static async addHistoryStateListener(callback: () => void): Promise<void> {
        this.historyStateListeners.push(callback)

        // Debounce to handle duplicate events that Photoshop sometimes sends
        let debounceTimer: ReturnType<typeof setTimeout> | null = null
        await addListener<HistoryStateChangedDescriptor>(
            'historyStateChanged',
            descriptor => {
                console.log('historyStateChanged', descriptor.ID)
                if (debounceTimer) {
                    clearTimeout(debounceTimer)
                }
                debounceTimer = setTimeout(() => {
                    debounceTimer = null
                    callback()
                }, 50)
            }
        )
    }

    static async addLayerSelectListener(
        callback: (layerId: number[]) => void
    ): Promise<void> {
        this.selectListeners.push(callback)

        await addListener<SelectDescriptor>('select', descriptor => {
            if (descriptor._target[0]._ref === 'layer')
                callback(descriptor.layerID!)
        })
    }

    static async addNewDocumentListener(
        callback: (documentId: number) => void
    ): Promise<void> {
        await addListener<NewDocumentDescriptor>('newDocument', descriptor => {
            callback(descriptor.documentID)
        })
    }

    static async addCloseDocumentListener(
        callback: (documentId: number) => void
    ): Promise<void> {
        await addListener<CloseDescriptor>('close', descriptor => {
            callback(descriptor.documentID)
        })
    }

    static async addSelectDocumentListener(
        callback: (documentId: number) => void
    ): Promise<void> {
        await addListener<SelectDescriptor>('select', descriptor => {
            if (descriptor._target[0]._ref === 'document')
                callback(descriptor.documentID!)
        })
    }

    static async addTimelineTimeChangeListener(
        callback: (frame: number) => void
    ): Promise<void> {
        await addListener<SetTimelineTimeDescriptor>('set', descriptor => {
            if (descriptor.to._obj === 'timecode')
                callback(
                    descriptor.to.frameRate * descriptor.to.seconds +
                        descriptor.to.frame
                )
        })
    }

    static async addLayerVisibilityChangeListener(
        callback: (layerName: string, visible: boolean) => void
    ): Promise<void> {
        await addListener<HideDescriptor>('hide', descriptor => {
            callback(
                descriptor.null[0]._name ??
                    ps.app.activeDocument.activeLayers[0].name,
                false
            )
        })
        await addListener<ShowDescriptor>('show', descriptor => {
            callback(
                descriptor.null[0]._name ??
                    ps.app.activeDocument.activeLayers[0].name,
                true
            )
        })
    }

    static async addLayerCreateListener(
        callback: (layerId: number) => void
    ): Promise<void> {
        await addListener<MakeDescriptor>('make', descriptor => {
            // Only trigger for layer creation
            if (descriptor.layerID) {
                console.log(
                    '[FireListeners] Layer created:',
                    descriptor.layerID
                )
                callback(descriptor.layerID)
            }
        })
    }

    static async addLayerDeleteListener(callback: () => void): Promise<void> {
        await addListener<DeleteDescriptor>('delete', descriptor => {
            if (descriptor?._target?.some(target => target._ref === 'layer')) {
                callback()
            }
        })
    }

    static async addLayerMoveListener(callback: () => void): Promise<void> {
        await addListener<MoveDescriptor>('move', descriptor => {
            if (descriptor?._target?.some(target => target._ref === 'layer')) {
                callback()
            }
        })
    }
}

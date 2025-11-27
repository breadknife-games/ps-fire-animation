import { photoshop } from '../globals'
import { timelineService } from '../services/timeline-service'

export const notify = async (message: string) => {
    await photoshop.app.showAlert(message)
}

export const getProjectInfo = async () => {
    const doc = photoshop.app.activeDocument
    const info = {
        name: doc.name,
        path: doc.path,
        id: doc.id
    }
    return info
}

export const timelineGetState = () => timelineService.getState()
export const timelineSelectLayer = (layerId: number) =>
    timelineService.selectLayer(layerId)
export const timelineSetLayerVisibility = (layerId: number, visible: boolean) =>
    timelineService.setLayerVisibility(layerId, visible)
export const timelineSetLayerColor = (layerId: number, colorValue: string) =>
    timelineService.setLayerColor(layerId, colorValue)
export const timelineRenameLayer = (layerId: number, name: string) =>
    timelineService.renameLayer(layerId, name)
export const timelineInsertEmptyFrameBefore = (layerId: number) =>
    timelineService.insertEmptyFrameBefore(layerId)
export const timelineInsertEmptyFrameAfter = (layerId: number) =>
    timelineService.insertEmptyFrameAfter(layerId)
export const timelineDuplicateFrameBefore = (layerId: number) =>
    timelineService.duplicateFrameBefore(layerId)
export const timelineDuplicateFrameAfter = (layerId: number) =>
    timelineService.duplicateFrameAfter(layerId)
export const timelineDeleteFrame = (layerId: number) =>
    timelineService.deleteFrame(layerId)
export const timelineDeleteLayer = (layerId: number) =>
    timelineService.deleteLayer(layerId)
export const timelineSetPlayheadIndex = (index: number) =>
    timelineService.setPlayheadIndex(index)
export const timelineGetLayerThumbnail = (
    layerId: number,
    resolution?: number
) => timelineService.getLayerThumbnail(layerId, resolution)
export const timelineToggleOnionSkin = () => timelineService.toggleOnionSkin()
export const timelineOpenOnionSkinSettings = () =>
    timelineService.openOnionSkinSettings()
export const timelineMoveLayer = (
    layerId: number,
    targetLayerId: number,
    position: 'above' | 'below' | 'inside'
) => timelineService.moveLayer(layerId, targetLayerId, position)
export const timelineMoveFrameLeft = (layerId: number) =>
    timelineService.moveFrameLeft(layerId)
export const timelineMoveFrameRight = (layerId: number) =>
    timelineService.moveFrameRight(layerId)
export const timelineCreateLayer = (
    anchorLayerId: number,
    position: 'above' | 'below'
) => timelineService.createLayer(anchorLayerId, position)
export const timelineCreateGroup = (
    anchorLayerId: number,
    position: 'above' | 'below'
) => timelineService.createGroup(anchorLayerId, position)
export const timelineCreateVideoGroup = (
    anchorLayerId: number,
    position: 'above' | 'below'
) => timelineService.createVideoGroup(anchorLayerId, position)
export const timelineNormalize = () => timelineService.normalizeTimeline()
export const timelineCreateVideoTimeline = () =>
    timelineService.createVideoTimeline()
export const previewGetState = () => timelineService.getPreviewState()
export const previewRenderFrame = (order: number, resolution?: number) =>
    timelineService.renderPreviewFrame(order, resolution)

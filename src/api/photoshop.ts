import { photoshop } from '../globals'
import { previewService } from '../services/preview-service'
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
export const timelineSoloLayer = (layerId: number) =>
    timelineService.soloLayer(layerId)
export const timelineMakeAllVisible = () => timelineService.makeAllVisible()
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
export const timelineDuplicateLayer = (layerId: number) =>
    timelineService.duplicateLayer(layerId)
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
    position: 'above' | 'below' | 'inside',
    name?: string,
    colorValue?: string
) => timelineService.createLayer(anchorLayerId, position, name, colorValue)
export const timelineCreateGroup = (
    anchorLayerId: number,
    position: 'above' | 'below' | 'inside',
    name?: string,
    colorValue?: string
) => timelineService.createGroup(anchorLayerId, position, name, colorValue)
export const timelineCreateVideoGroup = (
    anchorLayerId: number,
    position: 'above' | 'below' | 'inside',
    name?: string,
    colorValue?: string
) => timelineService.createVideoGroup(anchorLayerId, position, name, colorValue)
export const timelineNormalize = () => timelineService.normalizeTimeline()
export const timelineCreateVideoTimeline = () =>
    timelineService.createVideoTimeline()
export const timelineApplyLayerFocus = (
    selectedLayerIds: number[],
    opacity: number
) => timelineService.applyLayerFocus(selectedLayerIds, opacity)
export const timelineClearLayerFocus = () => timelineService.clearLayerFocus()
export const previewGetState = () => previewService.getPreviewState()
export const previewRenderFrame = (frameId: string, resolution?: number) =>
    previewService.renderPreviewFrame(frameId, resolution)
export const previewSetSettings = (fps: number, repeat: boolean) =>
    previewService.setPreviewSettings(fps, repeat)

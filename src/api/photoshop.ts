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
export const timelineInsertEmptyFrameAfter = (layerId: number) =>
    timelineService.insertEmptyFrameAfter(layerId)
export const timelineDuplicateFrame = (layerId: number) =>
    timelineService.duplicateFrameLayer(layerId)
export const timelineDeleteFrame = (layerId: number) =>
    timelineService.deleteFrame(layerId)
export const timelineSetPlayheadIndex = (index: number) =>
    timelineService.setPlayheadIndex(index)
export const timelineGetLayerThumbnail = (
    layerId: number,
    resolution?: number
) => timelineService.getLayerThumbnail(layerId, resolution)
export const timelineToggleOnionSkin = () => timelineService.toggleOnionSkin()
export const timelineOpenOnionSkinSettings = () =>
    timelineService.openOnionSkinSettings()
export const previewGetState = () => timelineService.getPreviewState()

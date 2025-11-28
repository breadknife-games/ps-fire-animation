/**
 * Store for controlling preview playback
 * This store acts as a bridge between keyboard commands and the PreviewPanel component
 */

export interface PreviewPlaybackControl {
    play: () => void
    pause: () => void
    stop: () => void
    playPause: () => void
    playStop: () => void
}

export const previewPlaybackControl = $state<PreviewPlaybackControl>({
    play: () => {},
    pause: () => {},
    stop: () => {},
    playPause: () => {},
    playStop: () => {}
})

export function registerPreviewControls(controls: PreviewPlaybackControl) {
    previewPlaybackControl.play = controls.play
    previewPlaybackControl.pause = controls.pause
    previewPlaybackControl.stop = controls.stop
    previewPlaybackControl.playPause = controls.playPause
    previewPlaybackControl.playStop = controls.playStop
}

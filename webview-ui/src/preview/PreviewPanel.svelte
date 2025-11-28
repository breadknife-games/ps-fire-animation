<script lang="ts">
    import { onDestroy, untrack } from 'svelte'
    import IconButton from '../timeline/components/IconButton.svelte'
    import IconPlay from '../lib/components/icons/IconPlay.svelte'
    import IconPause from '../lib/components/icons/IconPause.svelte'
    import IconStop from '../lib/components/icons/IconStop.svelte'
    import IconRefresh from '../lib/components/icons/IconRefresh.svelte'
    import IconDownload from '../lib/components/icons/IconDownload.svelte'
    import IconArrowLeft from '../lib/components/icons/IconArrowLeft.svelte'
    import IconArrowRight from '../lib/components/icons/IconArrowRight.svelte'
    import {
        loadPreviewState,
        previewState,
        type PreviewLoadingStatus
    } from '../stores/previewStore.svelte'
    import { generateGif, downloadGif } from '../lib/gif-generator'
    import { getApiClient } from '../lib/api-client'

    const defaultLoadingState: PreviewLoadingStatus = {
        phase: 'idle',
        message: 'Idle',
        progress: 0,
        total: 0,
        current: 0,
        error: null
    }

    let isPlaying = $state<boolean>(false)
    let repeat = $state<boolean>(previewState.state?.repeat ?? true)
    let fps = $state<number>(previewState.state?.fps ?? 12)
    let fpsDropdownOpen = $state<boolean>(false)
    let customFpsInput = $state<string>('12')
    let playInterval: number | null = null
    let currentFrameIndex = $state<number>(0)
    let thumbnailRefs: Map<number, HTMLButtonElement> = new Map()
    let isDownloading = $state<boolean>(false)
    let loadingInfo = $derived(previewState.loadingState)
    let frames = $derived(previewState.state?.frames ?? [])

    // Scroll selected thumbnail into view when not playing
    $effect(() => {
        currentFrameIndex
        if (!isPlaying) {
            const selectedButton = thumbnailRefs.get(currentFrameIndex)
            if (selectedButton) {
                selectedButton.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                })
            }
        }
    })
    $effect(() => {
        if (!frames.length) {
            currentFrameIndex = 0
            return
        }
        if (currentFrameIndex > frames.length - 1) {
            currentFrameIndex = 0
        }
    })

    // Stop playing if frames change
    $effect(() => {
        frames
        if (untrack(() => isPlaying)) {
            handleStop()
        }
    })

    // Sync fps and repeat from previewState when it changes
    $effect(() => {
        if (previewState.state) {
            repeat = previewState.state.repeat
            fps = previewState.state.fps
        }
    })

    $effect(() => {
        const selectedFrameId = previewState.state?.selectedFrameId
        if (!selectedFrameId) return
        if (isPlaying) return
        if (frames.length === 0) return

        const frameIndex = frames.findIndex(
            frame => frame.id === selectedFrameId
        )

        if (
            frameIndex >= 0 &&
            frameIndex !== untrack(() => currentFrameIndex)
        ) {
            currentFrameIndex = frameIndex
        }
    })

    const currentFrame = $derived(frames[currentFrameIndex])
    const currentImage = $derived(
        currentFrame ? (previewState.frameImages[currentFrame.id] ?? '') : ''
    )
    const progressPercent = $derived(
        formatProgressValue(previewState.loadingState.progress)
    )
    const canNavigate = $derived(frames.length > 0)

    function handleSelectFrame(index: number) {
        currentFrameIndex = index
        syncTimelineWithPreview()
    }

    function setThumbnailRef(node: HTMLButtonElement, index: number) {
        thumbnailRefs.set(index, node)
        return {
            destroy() {
                thumbnailRefs.delete(index)
            }
        }
    }

    function handleRefresh() {
        void loadPreviewState()
    }

    function handlePreviousFrame() {
        if (!canNavigate) return
        currentFrameIndex =
            currentFrameIndex > 0 ? currentFrameIndex - 1 : frames.length - 1
        syncTimelineWithPreview()
    }

    function handleNextFrame() {
        if (!canNavigate) return
        currentFrameIndex =
            currentFrameIndex < frames.length - 1 ? currentFrameIndex + 1 : 0
        syncTimelineWithPreview()
    }

    function syncTimelineWithPreview() {
        const api = getApiClient()
        const currentFrame = frames[currentFrameIndex]
        if (!currentFrame) return

        void api.timelineSelectLayer(currentFrame.layerIds[0]).catch(err => {
            console.error('Failed to sync timeline with preview:', err)
        })
    }

    function handlePlay() {
        if (!canNavigate || isPlaying) return
        isPlaying = true
        playInterval = window.setInterval(() => {
            currentFrameIndex =
                currentFrameIndex < frames.length - 1
                    ? currentFrameIndex + 1
                    : 0
            if (currentFrameIndex === 0 && !repeat) {
                handleStop()
                return
            }
        }, 1000 / fps)
    }

    function handlePause() {
        if (!isPlaying) return
        isPlaying = false
        if (playInterval !== null) {
            clearInterval(playInterval)
            playInterval = null
        }
        syncTimelineWithPreview()
    }

    function handleStop() {
        if (!isPlaying) return
        isPlaying = false
        if (playInterval !== null) {
            clearInterval(playInterval)
            playInterval = null
        }
        if (frames.length > 0) {
            currentFrameIndex = 0
        }
    }

    async function handleDownloadGif() {
        if (!canNavigate || isDownloading) return

        isDownloading = true

        // Set loading state to show progress bar
        previewState.loadingState = {
            phase: 'loading',
            message: 'Generating GIF...',
            progress: 0,
            total: 0,
            current: 0,
            error: null
        }

        try {
            // Get all frame images in order
            const imageSources = frames.map(
                frame => previewState.frameImages[frame.id]
            )

            // Check if all images are loaded
            if (imageSources.some(src => !src)) {
                throw new Error('Not all frames are loaded')
            }

            // Generate GIF with timestamp in filename
            const timestamp = new Date()
                .toISOString()
                .replace(/[:.]/g, '-')
                .slice(0, -5)
            const filename = `animation-${timestamp}-${fps}fps.gif`

            const gifBlob = await generateGif(imageSources, {
                fps,
                repeat: repeat ? 0 : 1, // 0 = infinite loop, 1 = play once
                onProgress: (current, total) => {
                    previewState.loadingState = {
                        phase: 'loading',
                        message: `Generating GIF frame ${current + 1} of ${total}...`,
                        progress: (current + 1) / total,
                        total,
                        current: current + 1,
                        error: null
                    }
                }
            })

            // Download the GIF
            downloadGif(gifBlob, filename)

            // Reset loading state
            previewState.loadingState = defaultLoadingState
        } catch (error) {
            console.error('Failed to download GIF:', error)
            previewState.loadingState = {
                phase: 'error',
                message: 'Failed to generate GIF',
                progress: 0,
                total: 0,
                current: 0,
                error: error instanceof Error ? error.message : String(error)
            }

            // Clear error after 3 seconds
            setTimeout(() => {
                previewState.loadingState = defaultLoadingState
            }, 3000)
        } finally {
            isDownloading = false
        }
    }

    function toggleFpsDropdown() {
        fpsDropdownOpen = !fpsDropdownOpen
        if (fpsDropdownOpen) {
            customFpsInput = String(fps)
        }
    }

    function closeFpsDropdown() {
        fpsDropdownOpen = false
    }

    function setFpsPreset(value: number) {
        fps = value
        closeFpsDropdown()
        // Save to document
        savePreviewSettings(fps, repeat)
        // Restart playback with new FPS if currently playing
        if (isPlaying) {
            handlePause()
            handlePlay()
        }
    }

    function applyCustomFps() {
        const value = parseInt(customFpsInput, 10)
        if (!isNaN(value) && value >= 1 && value <= 60) {
            fps = value
            closeFpsDropdown()
            // Save to document
            savePreviewSettings(fps, repeat)
            // Restart playback with new FPS if currently playing
            if (isPlaying) {
                handlePause()
                handlePlay()
            }
        }
    }

    onDestroy(() => {
        if (playInterval !== null) {
            clearInterval(playInterval)
        }
    })

    function formatProgressValue(progress: number) {
        if (!Number.isFinite(progress)) return 0
        return Math.min(100, Math.max(0, Math.round(progress * 100)))
    }

    function savePreviewSettings(fps: number, repeat: boolean) {
        const api = getApiClient()
        void api.previewSetSettings(fps, repeat).catch(err => {
            console.error('Failed to save preview settings:', err)
        })
    }

    function handleRepeatToggle() {
        repeat = !repeat
        // Save to document
        savePreviewSettings(fps, repeat)
    }
</script>

<div
    class="flex min-h-0 flex-1 h-full flex-col bg-timeline-surface-2 text-timeline-foreground">
    <div
        class="flex shrink-0 items-center justify-between border-b border-timeline-border bg-timeline-surface-1 px-2 py-1.5">
        <div class="flex items-center gap-1">
            <IconButton
                title="Play"
                onClick={handlePlay}
                disabled={!canNavigate || isPlaying}>
                <IconPlay class="h-3.5 w-3.5 fill-current" />
            </IconButton>
            <IconButton
                title="Pause"
                onClick={handlePause}
                disabled={!canNavigate || !isPlaying}>
                <IconPause class="h-3.5 w-3.5 fill-current" />
            </IconButton>
            <IconButton
                title="Stop"
                onClick={handleStop}
                disabled={!canNavigate || !isPlaying}>
                <IconStop class="h-3.5 w-3.5 fill-current" />
            </IconButton>
            <div class="mx-1 h-4 w-px bg-timeline-border"></div>
            <IconButton
                title="Previous frame"
                onClick={handlePreviousFrame}
                disabled={!canNavigate}>
                <IconArrowLeft class="h-3.5 w-3.5 fill-current" />
            </IconButton>
            <IconButton
                title="Next frame"
                onClick={handleNextFrame}
                disabled={!canNavigate}>
                <IconArrowRight class="h-3.5 w-3.5 fill-current" />
            </IconButton>
            <div class="mx-1 h-4 w-px bg-timeline-border"></div>
            <IconButton title="Refresh preview" onClick={handleRefresh}>
                <IconRefresh class="h-3.5 w-3.5 fill-current" />
            </IconButton>
            <IconButton
                title="Download GIF"
                onClick={handleDownloadGif}
                disabled={!canNavigate || isDownloading}>
                <IconDownload class="h-3.5 w-3.5 fill-current" />
            </IconButton>
        </div>
        <div class="flex items-center gap-1">
            <button
                type="button"
                onclick={handleRepeatToggle}
                title={repeat ? 'Repeat enabled' : 'Play once'}
                class={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                    repeat
                        ? 'border-timeline-playhead bg-timeline-playhead/15 text-timeline-playhead'
                        : 'border-transparent bg-transparent text-timeline-muted hover:bg-timeline-button-hover hover:border-timeline-border'
                }`}>
                <span
                    class="flex h-full w-full items-center justify-center font-semibold"
                    style={repeat
                        ? 'font-size: 15px; line-height: 0; margin-top: -1px;'
                        : 'font-size: 11px; line-height: 0;'}
                    >{repeat ? '∞' : '1×'}</span>
            </button>
            <div class="relative flex items-center">
                <button
                    type="button"
                    onclick={toggleFpsDropdown}
                    title="Set FPS"
                    class="inline-flex h-6 items-center justify-center gap-1 rounded-md border border-transparent bg-transparent px-2 text-timeline-foreground transition hover:bg-timeline-button-hover hover:border-timeline-border">
                    <span
                        class="text-xs font-medium tabular-nums"
                        style="line-height: 1; margin-top: -0.5px;">{fps}</span>
                    <span
                        class="text-[9px] text-timeline-muted"
                        style="line-height: 1; margin-top: -0.5px;">fps</span>
                </button>

                {#if fpsDropdownOpen}
                    <div
                        class="absolute right-0 top-full z-50 mt-1 w-28 rounded border border-timeline-border bg-timeline-surface-1 py-1 shadow-lg"
                        role="menu">
                        {#each [6, 8, 10, 12, 15, 24, 30, 60] as preset}
                            <button
                                type="button"
                                onclick={() => setFpsPreset(preset)}
                                class={`w-full px-3 py-1 text-left text-xs transition hover:bg-timeline-surface-3 ${
                                    fps === preset
                                        ? 'text-timeline-playhead'
                                        : 'text-timeline-foreground'
                                }`}>
                                {preset} fps
                            </button>
                        {/each}
                        <div class="my-1 border-t border-timeline-border"></div>
                        <div class="px-2 py-1">
                            <div class="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    bind:value={customFpsInput}
                                    onkeydown={e =>
                                        e.key === 'Enter' && applyCustomFps()}
                                    placeholder="Custom"
                                    class="w-full rounded border border-timeline-border bg-timeline-surface-2 px-2 py-1 text-xs text-timeline-foreground focus:border-timeline-playhead focus:outline-none" />
                                <button
                                    type="button"
                                    onclick={applyCustomFps}
                                    class="rounded bg-timeline-playhead px-2 py-1 text-xs text-white hover:bg-timeline-playhead/80">
                                    Set
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        class="fixed inset-0 z-40"
                        onclick={closeFpsDropdown}
                        aria-label="Close FPS dropdown"></button>
                {/if}
            </div>
        </div>
    </div>

    <div
        class="relative h-1 w-full overflow-hidden bg-timeline-surface-2"
        class:opacity-0={previewState.loadingState.phase !== 'loading'}>
        <div
            class="h-full bg-timeline-playhead"
            class:transition-none={loadingInfo.phase !== 'loading'}
            class:transition-[width]={loadingInfo.phase === 'loading'}
            class:duration-200={loadingInfo.phase === 'loading'}
            class:ease-out={loadingInfo.phase === 'loading'}
            style={`width: ${loadingInfo.phase === 'loading' ? progressPercent : 0}%;`}>
        </div>
    </div>

    <div class="flex flex-1 flex-col gap-3 bg-timeline-surface-2 p-3">
        {#if loadingInfo.phase === 'error'}
            <div
                class="rounded border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-200">
                {loadingInfo.message ||
                    'Something went wrong while building the preview.'}
                {#if loadingInfo.error}
                    <div class="mt-1 text-[10px] text-red-300/70">
                        {loadingInfo.error}
                    </div>
                {/if}
            </div>
        {/if}

        <div class="flex min-h-0 flex-1 flex-col gap-3">
            <div class="relative flex flex-1 items-center justify-center">
                {#if frames.length}
                    {#if currentImage}
                        <img
                            src={currentImage}
                            alt="Preview frame"
                            class="max-h-full max-w-full select-none object-contain rounded-md" />
                    {:else}
                        <div class="flex items-center justify-center">
                            <span
                                class="h-8 w-8 animate-spin rounded-full border-4 border-timeline-border/30 border-t-timeline-playhead"
                            ></span>
                        </div>
                    {/if}
                    {#if !isPlaying}
                        <div
                            class="absolute right-2 top-2 rounded bg-black/65 px-2 py-1 text-[10px] font-medium text-white">
                            {currentFrameIndex + 1} / {frames.length}
                        </div>
                    {/if}
                {:else}
                    <div class="text-center text-xs text-timeline-muted">
                        Build frames in the timeline to preview them here.
                    </div>
                {/if}
            </div>

            {#if frames.length}
                <div class="flex gap-2 overflow-x-auto">
                    {#each frames as frame, index}
                        {@const thumbnailSrc =
                            previewState.frameImages[frame.id] ?? ''}
                        <button
                            type="button"
                            use:setThumbnailRef={index}
                            class={`relative flex shrink-0 items-center justify-center rounded border-2 transition ${
                                index === currentFrameIndex && !isPlaying
                                    ? 'border-timeline-playhead bg-timeline-playhead/20 shadow-[0_0_0_1px_rgba(52,107,255,0.5)]'
                                    : 'border-transparent bg-timeline-surface-4/40 hover:border-timeline-border/50'
                            }`}
                            title={`Frame ${index + 1}`}
                            aria-pressed={index === currentFrameIndex}
                            onclick={() => handleSelectFrame(index)}>
                            <div class="relative inline-block w-[60px]">
                                {#if thumbnailSrc}
                                    <img
                                        src={thumbnailSrc}
                                        alt={`Frame ${index + 1} thumbnail`}
                                        class="w-full select-none object-contain bg-white rounded-sm border border-timeline-border/30" />
                                    <div
                                        class="pointer-events-none absolute left-0.5 top-0.5 rounded bg-black/65 px-1 text-[9px] font-medium leading-tight text-white">
                                        {index + 1}
                                    </div>
                                {:else}
                                    <div
                                        class="flex h-full w-full items-center justify-center text-timeline-muted">
                                        <span
                                            class="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-transparent"
                                        ></span>
                                    </div>
                                {/if}
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>

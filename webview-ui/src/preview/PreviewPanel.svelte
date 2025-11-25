<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    frameImages,
    loadPreviewState,
    previewState,
  } from "../stores/previewStore";

  let playing = true;
  let frameIndex = 0;
  let loopHandle: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    await loadPreviewState();
    startLoop();
  });

  onDestroy(() => stopLoop());

  $: state = $previewState;
  $: images = $frameImages;
  $: frames = state?.frames ?? [];

  $: if (!frames.length) {
    frameIndex = 0;
    stopLoop();
  } else if (frameIndex >= frames.length) {
    frameIndex = 0;
  }

  function startLoop() {
    stopLoop();
    if (!playing) return;
    loopHandle = setInterval(() => {
      if (!frames.length) return;
      frameIndex = (frameIndex + 1) % frames.length;
    }, frames[frameIndex]?.delayMs ?? 120);
  }

  function stopLoop() {
    if (loopHandle) {
      clearInterval(loopHandle);
      loopHandle = null;
    }
  }

  function togglePlayback() {
    playing = !playing;
    if (playing) startLoop();
    else stopLoop();
  }

  function selectFrame(index: number) {
    frameIndex = index;
    playing = false;
    stopLoop();
  }
</script>

<div class="flex h-full flex-col bg-slate-950 text-slate-100">
  <header class="flex items-center justify-between border-b border-slate-800 px-4 py-2">
    <div class="text-sm font-semibold uppercase tracking-wide text-slate-300">
      Preview
    </div>
    <div class="flex items-center gap-2 text-xs">
      <button
        class="rounded border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
        on:click={togglePlayback}
      >
        {playing ? "Pause" : "Play"}
      </button>
      <button
        class="rounded border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
        on:click={loadPreviewState}
      >
        Refresh
      </button>
    </div>
  </header>

  {#if !frames.length}
    <div class="flex flex-1 items-center justify-center text-sm text-slate-400">
      No frames detected. Build frames in the timeline to preview.
    </div>
  {:else}
    <div class="flex flex-1 flex-col gap-4 overflow-hidden p-4">
      <div class="flex flex-1 items-center justify-center rounded border border-slate-800 bg-slate-900">
        {#if images[frames[frameIndex].layerId]}
          <img
            src={images[frames[frameIndex].layerId]}
            alt={frames[frameIndex].name}
            class="max-h-full max-w-full object-contain"
          />
        {:else}
          <div class="text-sm text-slate-500">Loading frame…</div>
        {/if}
      </div>
      <div class="flex gap-2 overflow-auto border-t border-slate-900 pt-2 text-xs">
        {#each frames as frame, index (frame.layerId)}
          <button
            class={`flex min-w-[80px] flex-col rounded border px-3 py-2 ${
              index === frameIndex
                ? "border-amber-400 bg-amber-500/20 text-amber-200"
                : "border-slate-800 bg-slate-900 text-slate-300"
            }`}
            on:click={() => selectFrame(index)}
          >
            <span class="text-[10px] uppercase tracking-wide text-slate-400">
              Frame {index + 1}
            </span>
            <span class="truncate text-sm">{frame.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>


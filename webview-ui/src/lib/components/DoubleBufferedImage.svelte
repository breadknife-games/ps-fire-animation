<!-- @component

Adobe's <img /> implementation is awful. It flickers when changing the src of 
img elements. This component double buffers the image so that the new image
can be loaded in the background while the old image is shown.

-->
<script lang="ts">
    import { FunctionMutex } from '../FunctionMutex'
    import { waitForMs } from '../utils'

    export let src = ''
    export let alt = ''
    export let loadTime = 200

    let showA = true
    let srcA = ''
    let srcB = ''

    let srcToSet = ''

    $: {
        setImage(src)
    }

    export function setImage(img: string) {
        if (img === srcToSet) return
        srcToSet = img
        setImageMutex.run()
    }

    const setImageMutex = new FunctionMutex(async () => {
        if (showA) srcB = srcToSet
        else srcA = srcToSet

        await waitForMs(loadTime)

        showA = !showA
        if (showA) srcB = ''
        else srcA = ''
    })
</script>

<div class="double-buffered-image">
    <img src={srcA} {alt} style="z-index: {showA ? 1 : 0}" class="a" />
    <img src={srcB} {alt} style="z-index: {showA ? 0 : 1}" class="b" />
</div>

<style>
    .double-buffered-image {
        position: relative;
        width: 100%;
        height: 100%;
    }

    img {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
</style>

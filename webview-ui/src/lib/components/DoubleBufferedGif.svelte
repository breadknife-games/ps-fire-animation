<!-- @component

Adobe's <img /> implementation is awful. It flickers and restarts gifs when 
changing the src of img elements. The idea of this component is to show a 
"loading" image while the gif gets loaded to minimize the number of gif-restarts.

-->
<script lang="ts">
    import { FunctionMutex } from '../FunctionMutex'
    import { waitForMs } from '../utils'

    export let imgLoadTime = 100
    export let gifLoadTime = 300
    export let src = ''
    export let loadingSrc = ''

    const transparentImg =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII='

    let loadingImage = ''
    let gif = ''

    let loadingImageToSet = ''
    let gifToSet = ''

    $: {
        setGif(loadingSrc, src)
    }

    export function setGif(loadingImage: string, gif: string) {
        if (gif === gifToSet) return
        loadingImageToSet = loadingImage
        gifToSet = gif
        setImageMutex.run()
    }

    const setImageMutex = new FunctionMutex(async () => {
        loadingImage = loadingImageToSet
        await waitForMs(imgLoadTime)
        gif = gifToSet
        await waitForMs(gifLoadTime)
        loadingImage = transparentImg
        await waitForMs(imgLoadTime)
    })
</script>

<div class="double-buffered-gif">
    <img src={loadingImage} alt="loading" style="z-index: 1" />
    <img src={gif} alt="gif" style="z-index: 0" />
</div>

<style>
    .double-buffered-gif {
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

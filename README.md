# Fire Animation

A Photoshop plugin designed specifically for creating frame-by-frame sprite animations.

## What is it?

Fire Animation provides a streamlined timeline and preview system tailored for sprite animation work. While Photoshop has its own timeline, this plugin reimagines it specifically for sprite animation workflows.

## Features

### Timeline

- **Frame Management** - Create, duplicate, delete, and rearrange frames with ease
- **Layer Organization** - Organize your sprites into layers and groups
- **Onion Skinning** - See previous and next frames while you draw
- **Playhead Control** - Scrub through your animation timeline
- **Video Groups** - Manage multiple animation sequences in one document

### Preview

- **Real-time Playback** - Play, pause, and stop your animation instantly
- **Frame Controls** - Navigate frame-by-frame or jump to specific frames
- **Adjustable FPS** - Preview your animation at different frame rates
- **Loop Mode** - Toggle between looping and single playthrough
- **GIF Export** - Generate and download animated GIFs directly from the preview
- **Thumbnail Scrubbing** - Quick navigation through your animation frames

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Setup

Install dependencies for both main plugin and webview UI:

```bash
npm install
cd webview-ui && npm install
```

### Build Commands

**Development Mode** (watch for changes):

```bash
npm run dev
```

**Production Build**:

```bash
npm run build
```

**Package as CCX**:

```bash
npm run ccx
```

**Package as ZIP**:

```bash
npm run zip
```

### Project Structure

- `/src` - Main plugin code (UXP host)
- `/webview-ui` - UI components (Svelte)
- `/ccx` - Compiled plugin package
- `/dist` - Built files

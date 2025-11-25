export class FunctionMutex {
    private _running: boolean = false
    private _needsRun: boolean = false

    constructor(public readonly func: () => Promise<void>) {}

    public get running() {
        return this._running
    }

    async run() {
        if (this._running) {
            this._needsRun = true
            return
        }

        this._running = true
        await this.func()
        this._running = false

        if (this._needsRun) {
            this._needsRun = false
            await this.run()
        }
    }
}

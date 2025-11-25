export class CancellablePromise<T> extends Promise<T> {
    private _token: CancellationToken

    constructor(
        executor: (
            resolve: (value: T) => void,
            reject: (reason?: unknown) => void,
            token: CancellationToken
        ) => Promise<void> | void
    ) {
        const token = new CancellationToken()

        super((resolve, reject) => {
            try {
                const result = executor(resolve, reject, token)
                if (result instanceof Promise) {
                    result.catch(reject)
                }
            } catch (e) {
                reject(e)
            }
        })

        this._token = token
    }

    public async cancel() {
        this._token.cancel()

        try {
            await this
        } catch (e) {
            if (e instanceof CancelledError) {
                return
            }

            throw e
        }
    }
}

export class CancellationToken {
    private _cancelled = false

    public cancel() {
        this._cancelled = true
    }

    public get cancelled() {
        return this._cancelled
    }

    public throwIfCancelled() {
        if (this._cancelled) throw new CancelledError()
    }
}

export class CancelledError extends Error {
    constructor() {
        super('Cancelled')
    }
}

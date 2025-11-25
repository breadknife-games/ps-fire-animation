import { photoshop as ps } from '../../globals'

export class ActionTarget {
    constructor(private _target: any) {}

    static fromLayer(id: number): ActionTarget {
        return new ActionTarget([{ _ref: 'layer', _id: id }])
    }

    async getPropertyAsync<T>(property: string): Promise<T> {
        const result = await ps.action.batchPlay(
            [
                {
                    _obj: 'get',
                    _target: [{ _property: property }, ...this._target]
                }
            ],
            {}
        )
        return result[0][property]
    }

    // Adobe uses synchronous execution for their getters/setters despite warning against it. So we'll
    // just make sure to use it sparingly and with simple data.
    getProperty<T = any>(property: string): T {
        return (
            ps.action.batchPlay(
                [
                    {
                        _obj: 'get',
                        _target: [{ _property: property }, ...this._target]
                    }
                ],
                { synchronousExecution: true }
            ) as any
        )[0][property] as T
    }

    async setPropertyAsync(property: string, value: any) {
        await ps.action.batchPlay(
            [
                {
                    _obj: 'set',
                    _target: this._target,
                    to: {
                        [property]: value
                    }
                }
            ],
            {}
        )
    }
}

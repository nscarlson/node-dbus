import { describe, expect, test } from '@jest/globals'
import utils from './utils'

describe('utils', () => {
    it('Signature method returns correct values', () => {
        expect(utils.Signature('Auto')).toEqual('v')
        expect(utils.Signature(String)).toEqual('s')
        expect(utils.Signature(Number)).toEqual('d')
        expect(utils.Signature(Boolean)).toEqual('b')
        expect(utils.Signature(Array<any>)).toEqual('av')
        expect(utils.Signature(Object)).toEqual('a{sv}')
        expect(utils.Signature('elsetype')).toEqual('v')
    })

    it('Define function returns correct data definition', () => {
        expect(utils.Define('Auto')).toEqual({ type: 'v' })
        expect(utils.Define(String)).toEqual({ type: 's' })
        expect(utils.Define(Number)).toEqual({ type: 'd' })
        expect(utils.Define(Boolean)).toEqual({ type: 'b' })
        expect(utils.Define(Array)).toEqual({ type: 'av' })
        expect(utils.Define(Object)).toEqual({ type: 'a{sv}' })

        expect(utils.Define('elsetype')).toEqual({ type: 'v' })
        expect(utils.Define(null, 'testName')).toHaveProperty(
            'name',
            'testName',
        )
        expect(utils.Define(null)).not.toHaveProperty('name')
    })

    describe('ForEach', () => {
        it('must call provided callback with every element', () => {
            const mockCallback = jest.fn((value) => undefined)

            const arr = [0, 1, 2, 3]

            utils.ForEachAsync(
                arr,
                mockCallback,
                (isComplete: boolean) => isComplete,
            )

            expect(
                mockCallback.mock.calls.map((value) =>
                    value.filter((v) => typeof v !== 'function'),
                ),
            ).toEqual(arr.map((value, index) => [value, index, arr]))

            expect(mockCallback).toHaveBeenCalledTimes(arr.length)
        })

        it('catches thrown errors', () => {
            const mockCallbackThrows = jest.fn((value) => {
                throw new Error('test error')
            })

            const arr = [1, 2, 3, 4]

            const forEachAsync = () =>
                utils.ForEachAsync(
                    arr,
                    mockCallbackThrows,
                    (isComplete: boolean) => isComplete,
                )

            expect(() => {
                throw new Error('booyah')
            }).toThrow(Error)
        })
    })
})

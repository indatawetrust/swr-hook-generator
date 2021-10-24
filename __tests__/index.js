import React from 'react'
import { act, renderHook } from '@testing-library/react-hooks'
import { SWRConfig } from 'swr'
import { useGetData, useCreateData, STATUSES } from '../fixtures/service'

jest.useRealTimers();

const wrapper = ({ children }) => (
  <SWRConfig value={{ provider: () => new Map() }}>
    {children}
  </SWRConfig>
)

describe('hook tests', () => {
  test('#query - successful test', async () => {
    const { result, waitFor } = renderHook(() => useGetData({
      action: () => {
        return Promise.resolve([1,2,3])
      },
      options: {
        fallbackData: []
      }
    }), { wrapper })

    expect(result.current.data).toStrictEqual([])

    expect(result.current.status).toBe(STATUSES.LOADING)
  
    await waitFor(() => result.current.status === STATUSES.SUCCEED);
  
    expect(result.current.data).toStrictEqual([1,2,3])
  })

  test('#query - failure test', async () => {
    const { result, waitFor } = renderHook(() => useGetData({
      action: () => {
        return new Promise((_resolve, reject) => {
          setTimeout(() => {
            reject(new Error('big fail'))
          }, 500)
        })
      },
      options: {
        fallbackData: []
      }
    }), { wrapper })

    act(() => {
      result.current.mutate([])
    })

    expect(result.current.data).toStrictEqual([])

    expect(result.current.status).toBe(STATUSES.LOADING)

    await waitFor(() => result.current.status === STATUSES.FAILED);
    
    expect(result.current.error).toStrictEqual(new Error('big fail'))
  })

  test('#mutation - successful test', async () => {
    const { result, waitFor } = renderHook(() => useCreateData({
      action: (name) => {
        return Promise.resolve([name])
      },
      mutator: (prevState, nextState) => ([...prevState, ...nextState]),
      options: { fallbackData: [] }
    }), { wrapper })

    expect(result.current.data).toStrictEqual([])

    act(() => {
      result.current.mutate('ahmet')
    })

    expect(result.current.status).toBe(STATUSES.LOADING)
  
    await waitFor(() => result.current.status === STATUSES.SUCCEED);
  
    expect(result.current.data).toStrictEqual(['ahmet'])
  })

  test('#mutation - successful test (without mutator)', async () => {
    const { result, waitFor } = renderHook(() => useCreateData({
      action: (name) => {
        return Promise.resolve([name])
      },
      options: { fallbackData: [] }
    }), { wrapper })

    expect(result.current.data).toStrictEqual([])

    act(() => {
      result.current.mutate('ahmet')
    })

    expect(result.current.status).toBe(STATUSES.LOADING)
  
    await waitFor(() => result.current.status === STATUSES.SUCCEED);
  
    expect(result.current.data).toStrictEqual(['ahmet'])
  })

  test('#mutation - failure test', async () => {
    const { result, waitFor } = renderHook(() => useCreateData({
      action: (_name) => {
        return new Promise((_resolve, reject) => {
          setTimeout(() => {
            reject(new Error('big fail'))
          }, 100)
        })
      },
      mutator: (prevState, nextState) => ([...prevState, ...nextState]),
      options: { fallbackData: [] }
    }), { wrapper })

    expect(result.current.data).toStrictEqual([])

    act(() => {
      result.current.mutate('ahmet')
    })

    expect(result.current.status).toBe(STATUSES.LOADING)
  
    await waitFor(() => result.current.status === STATUSES.FAILED);

    expect(result.current.error).toStrictEqual(new Error('big fail'))
  })
})

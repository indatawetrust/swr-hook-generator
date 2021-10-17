import { act, renderHook } from '@testing-library/react-hooks'
import { useGetData, useCreateData, STATUSES } from '../fixtures/service'

jest.useFakeTimers();

describe('hook tests', () => {
  test('#query - successful test', async () => {
    const { result, waitFor } = renderHook(() => useGetData({
      action: () => {
        return Promise.resolve([1,2,3])
      },
      fallbackData: []
    }))

    expect(result.current.status).toBe(STATUSES.LOADING)
  
    await waitFor(() => result.current.status === STATUSES.SUCCEED);
  
    expect(result.current.data).toStrictEqual([1,2,3])
  })

  test('#query - failure test', async () => {
    const { result, waitFor } = renderHook(() => useGetData({
      action: () => {
        throw new Error('big fail')
      },
      fallbackData: []
    }))

    act(() => {
      result.current.mutate()
    })

    expect(result.current.status).toBe(STATUSES.LOADING)

    await waitFor(() => result.current.status === STATUSES.FAILED);
    
    expect(result.current.error).toStrictEqual(new Error('big fail'))
  })

  test('#mutation - successful test', async () => {
    const { result, waitFor } = renderHook(() => useCreateData({
      action: (name) => {
        return Promise.resolve([name])
      },
      fallbackData: [],
      mutator: (prevState, nextState) => ([...prevState, ...nextState])
    }))

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
      fallbackData: [],
    }))

    act(() => {
      result.current.mutate('ahmet')
    })

    expect(result.current.status).toBe(STATUSES.LOADING)
  
    await waitFor(() => result.current.status === STATUSES.SUCCEED);
  
    expect(result.current.data).toStrictEqual(['ahmet'])
  })

  test('#mutation - failure test', async () => {
    const { result, waitFor } = renderHook(() => useCreateData({
      action: (name) => {
        throw new Error('big fail')
      },
      fallbackData: [],
      mutator: (prevState, nextState) => ([...prevState, ...nextState])
    }))

    expect(result.current.status).toBe(STATUSES.LOADING)

    act(() => {
      result.current.mutate('ahmet')
    })
  
    await waitFor(() => result.current.status === STATUSES.FAILED);

    expect(result.current.error).toStrictEqual(new Error('big fail'))
  })
})

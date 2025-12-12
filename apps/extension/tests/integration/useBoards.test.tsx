import { describe, test, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBoards, useCreateBoard } from '@/ui/shared/hooks/useBoards'
import 'fake-indexeddb/auto'
import type { ReactNode } from 'react'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useBoards', () => {
  beforeEach(() => {
    // Reset IndexedDB
    indexedDB = new IDBFactory()
  })

  test('returns empty list initially', async () => {
    const { result } = renderHook(() => useBoards(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

describe('useCreateBoard', () => {
  test('creates board and invalidates boards query', async () => {
    const wrapper = createWrapper()
    const { result: createResult } = renderHook(() => useCreateBoard(), { wrapper })
    const { result: listResult } = renderHook(() => useBoards(), { wrapper })

    await waitFor(() => expect(listResult.current.isSuccess).toBe(true))
    expect(listResult.current.data).toHaveLength(0)

    createResult.current.mutate({ name: 'Test Board' })

    await waitFor(() => expect(createResult.current.isSuccess).toBe(true))
    await waitFor(() => expect(listResult.current.data).toHaveLength(1))

    expect(listResult.current.data?.[0].name).toBe('Test Board')
  })
})

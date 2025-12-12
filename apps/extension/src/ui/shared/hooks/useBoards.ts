import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BoardRepository } from '@/infrastructure/storage/board-repository'
import { createBoard as createBoardDomain } from '@/domain/board'
import type { BoardContent } from '@chatham/types'
import * as Automerge from '@automerge/automerge'

const repository = new BoardRepository()

// Track initialization
let initPromise: Promise<void> | null = null

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = repository.initialize()
  }
  await initPromise
}

interface BoardListItem {
  id: string
  name: string
  cardCount: number
  updatedAt: number
}

export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: async (): Promise<BoardListItem[]> => {
      await ensureInitialized()
      return await repository.listBoards()
    }
  })
}

interface CreateBoardInput {
  name: string
}

export function useCreateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBoardInput) => {
      await ensureInitialized()

      const boardId = crypto.randomUUID()
      const board = createBoardDomain(input.name, 'temp-user')

      // Generate board key
      const boardKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      )

      await repository.saveBoard(boardId, board, boardKey)

      return { id: boardId, board }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    }
  })
}

import { create } from 'zustand'

interface AuthState {
  hasRecoveryPhrase: boolean
  isEvaluationMode: boolean
  evaluationStartedAt: number | null
  evaluationCardCount: number
}

interface AuthActions {
  setHasRecoveryPhrase: (value: boolean) => void
  startEvaluationMode: () => void
  incrementCardCount: () => void
  checkEvaluationLimit: () => boolean
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  hasRecoveryPhrase: false,
  isEvaluationMode: false,
  evaluationStartedAt: null,
  evaluationCardCount: 0,

  setHasRecoveryPhrase: (value) => set({ hasRecoveryPhrase: value }),

  startEvaluationMode: () => set({
    isEvaluationMode: true,
    evaluationStartedAt: Date.now(),
    evaluationCardCount: 0
  }),

  incrementCardCount: () => set((state) => ({
    evaluationCardCount: state.evaluationCardCount + 1
  })),

  checkEvaluationLimit: () => {
    const state = get()
    if (!state.isEvaluationMode) return true

    const elapsed = Date.now() - (state.evaluationStartedAt || 0)
    const hoursPassed = elapsed / (60 * 60 * 1000)

    if (hoursPassed >= 24) return false
    if (state.evaluationCardCount >= 10) return false

    return true
  }
}))

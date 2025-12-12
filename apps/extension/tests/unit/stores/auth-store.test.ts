import { describe, test, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/ui/shared/stores/auth-store'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      hasRecoveryPhrase: false,
      isEvaluationMode: false,
      evaluationStartedAt: null,
      evaluationCardCount: 0
    })
  })

  test('starts in unauthenticated state', () => {
    const state = useAuthStore.getState()

    expect(state.hasRecoveryPhrase).toBe(false)
    expect(state.isEvaluationMode).toBe(false)
  })

  test('checkEvaluationLimit returns true when under limit', () => {
    useAuthStore.setState({
      isEvaluationMode: true,
      evaluationStartedAt: Date.now(),
      evaluationCardCount: 5
    })

    const state = useAuthStore.getState()
    expect(state.checkEvaluationLimit()).toBe(true)
  })

  test('checkEvaluationLimit returns false when 10 cards reached', () => {
    useAuthStore.setState({
      isEvaluationMode: true,
      evaluationStartedAt: Date.now(),
      evaluationCardCount: 10
    })

    const state = useAuthStore.getState()
    expect(state.checkEvaluationLimit()).toBe(false)
  })

  test('checkEvaluationLimit returns false when 24 hours passed', () => {
    useAuthStore.setState({
      isEvaluationMode: true,
      evaluationStartedAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      evaluationCardCount: 0
    })

    const state = useAuthStore.getState()
    expect(state.checkEvaluationLimit()).toBe(false)
  })
})

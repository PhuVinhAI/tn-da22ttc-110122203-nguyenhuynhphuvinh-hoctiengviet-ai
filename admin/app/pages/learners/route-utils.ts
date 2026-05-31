import { generatePath } from 'react-router'
import { ROUTES } from '../../../lib/shared/constants'

export const learnerPath = {
  learners: () => ROUTES.LEARNERS,
  learner: (learnerId: string) => generatePath(ROUTES.LEARNER_DETAIL, { learnerId }),
  conversation: (learnerId: string, conversationId: string) =>
    generatePath(ROUTES.LEARNER_CONVERSATION_DETAIL, { learnerId, conversationId }),
  simulation: (learnerId: string, sessionId: string) => generatePath(ROUTES.LEARNER_SIMULATION_DETAIL, { learnerId, sessionId }),
}

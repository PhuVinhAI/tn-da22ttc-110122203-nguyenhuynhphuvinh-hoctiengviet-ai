import { generatePath } from 'react-router'
import { ROUTES } from '../../../lib/shared/constants'

export const simulationPath = {
  categories: () => ROUTES.SCENARIO_CATEGORIES,
  category: (categoryId: string) => generatePath(ROUTES.SCENARIO_CATEGORY_DETAIL, { categoryId }),
  categoryNew: () => ROUTES.SCENARIO_CATEGORY_NEW,
  categoryEdit: (id: string) => generatePath(ROUTES.SCENARIO_CATEGORY_EDIT, { id }),
  scenario: (scenarioId: string) => generatePath(ROUTES.SCENARIO_DETAIL, { scenarioId }),
  scenarioNew: (categoryId: string) => generatePath(ROUTES.SCENARIO_NEW, { categoryId }),
  scenarioEdit: (categoryId: string, id: string) => generatePath(ROUTES.SCENARIO_EDIT, { categoryId, id }),
  characterNew: (scenarioId: string) => generatePath(ROUTES.SCENARIO_CHARACTER_NEW, { scenarioId }),
  characterEdit: (scenarioId: string, id: string) => generatePath(ROUTES.SCENARIO_CHARACTER_EDIT, { scenarioId, id }),
}

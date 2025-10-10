import { router } from '../../trpc'
import { getProjectsList } from './get-projects-list.procedure'
import { createProject } from './create-project.procedure'
import { updateProject } from './update-project.procedure'
import { deleteProject } from './delete-project.procedure'

/**
 * Projects Domain Router
 * 
 * Aggregates all projects domain procedures.
 * Simple aggregation only - no business logic.
 */
export const projectsRouter = router({
  getProjectsList,
  createProject,
  updateProject,
  deleteProject,
})

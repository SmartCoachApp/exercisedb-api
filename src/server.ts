import { ExerciseController } from './modules'
import { App } from './app'

const app = new App([new ExerciseController()]).getApp()

export default {
  fetch: app.fetch,
  port: 80
}

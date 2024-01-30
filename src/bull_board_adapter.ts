import { Application } from '@adonisjs/core/app'
import { HttpContext, Router } from '@adonisjs/core/http'
import { ContainerBindings } from '@adonisjs/core/types'
import {
  AppControllerRoute,
  AppViewRoute,
  BullBoardQueues,
  ControllerHandlerReturnType,
  HTTPMethod,
  IServerAdapter,
  UIConfig,
} from '@bull-board/api/dist/typings/app.js'
import ejs from 'ejs'
import { resolve } from 'node:path'

export class BullBoardAdapter implements IServerAdapter {
  protected basePath = ''
  protected bullBoardQueues: BullBoardQueues | undefined
  protected errorHandler: ((error: Error) => ControllerHandlerReturnType) | undefined
  protected uiConfig: UIConfig = {}
  private viewPath: string = ''

  constructor(
    protected readonly app: Application<ContainerBindings>,
    protected readonly router: Router
  ) {}

  setBasePath(path: string): BullBoardAdapter {
    this.basePath = path
    return this
  }

  setStaticPath(_staticsRoute: string, _staticsPath: string): BullBoardAdapter {
    return this
  }

  setViewsPath(viewPath: string): BullBoardAdapter {
    this.viewPath = viewPath
    return this
  }

  setErrorHandler(handler: (error: Error) => ControllerHandlerReturnType) {
    this.errorHandler = handler
    return this
  }

  setApiRoutes(routes: AppControllerRoute[]): BullBoardAdapter {
    if (!this.errorHandler) {
      throw new Error(`Please call 'setErrorHandler' before using 'registerPlugin'`)
    } else if (!this.bullBoardQueues) {
      throw new Error(`Please call 'setQueues' before using 'registerPlugin'`)
    }

    routes.forEach((route) =>
      (Array.isArray(route.method) ? route.method : [route.method]).forEach(
        (method: HTTPMethod) => {
          this.router[method](route.route as string, async ({ request, response }: HttpContext) => {
            try {
              const output = await route.handler({
                queues: this.bullBoardQueues as BullBoardQueues,
                query: request.qs(),
                params: request.params(),
              })

              response.status(output.status || 200).json(output.body)
            } catch (e) {
              return response.status(500).send(e)
            }
          })
        }
      )
    )

    return this
  }

  setEntryRoute(routeDef: AppViewRoute): BullBoardAdapter {
    const viewHandler = ({ response }: HttpContext) => {
      const { name, params } = routeDef.handler({
        basePath: this.basePath,
        uiConfig: this.uiConfig,
      })

      const html = ejs.render(resolve(this.viewPath, name), params)

      response.header('content-type', 'application/html')
      response.send(html)
    }

    this.router[routeDef.method](routeDef.route as string, viewHandler)
    return this
  }

  setQueues(bullBoardQueues: BullBoardQueues): BullBoardAdapter {
    this.bullBoardQueues = bullBoardQueues
    return this
  }

  setUIConfig(config: UIConfig = {}): BullBoardAdapter {
    this.uiConfig = config
    return this
  }

  getRouter(): any {
    return this.app
  }
}

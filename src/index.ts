import ServiceBase from 'sarafa-svc-base'
import async from 'async'
import fastify, { FastifyInstance } from 'fastify'
import path from 'path'
import underPressure from '@fastify/under-pressure'
import fastifySwagger from '@fastify/swagger'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'

class FastifyService extends ServiceBase {
  server: FastifyInstance | undefined
  handler: any
  opts: {
    logger: boolean
    trustProxy: boolean
    disableRequestLogging: boolean
    port: number
  }
  mem: { plugins: Array<any>; routes: Array<any>; decorators: Array<any> }

  constructor (handler: any) {
    super(handler)
    this.handler = handler
    this.opts = handler.opts
    this.mem = {
      plugins: [
        { plugin: cors, config: {} },
        { plugin: underPressure, config: this.underPressureConfig() },
        { plugin: fastifyStatic, config: this.fastifyStaticConfig() },
        { plugin: fastifySwagger, config: this.swaggerConfig() },
        {
          plugin: require('@fastify/swagger-ui'),
          config: {
            routePrefix: '/documentation',
            uiConfig: {
              docExpansion: 'full',
              deepLinking: false
            },
            staticCSP: true,
            transformSpecificationClone: true
          }
        }
      ],
      routes: [],
      decorators: []
    }

    this.init()
  }

  async startServer () {
    if (this.server) {
      throw new Error(
        `ERR_SERVICE_EXISTS_CREATING_DUPLICATE${this.handler?.name}`
      )
    }

    this.server = fastify({
      logger: this.opts.logger,
      trustProxy: this.opts.trustProxy
    })

    this.mem.plugins.forEach(p => {
      if (!this.server) {
        throw new Error(
          `ERR_SERVICE_FASTIFY_NO_SERVER_FOUND_RESGITERING_PLUGINS${this.handler?.name}`
        )
      }
      this.server.register(p.plugin, p.config)
    })

    this.mem.decorators.forEach(d => {
      if (!this.server) {
        throw new Error(
          `ERR_SERVICE_FASTIFY_NO_SERVER_FOUND_RESGITERING_DECORATORS${this.handler?.name}`
        )
      }
      this.server.decorate(d)
    })

    this.mem.routes.forEach(r => {
      if (!this.server) {
        throw new Error(
          `ERR_SERVICE_FASTIFY_NO_SERVER_FOUND_RESGITERING_ROUTES${this.handler?.name}`
        )
      }
      this.server.route(r)
    })

    return await this.server.listen({
      port: this.opts.port
    })
  }

  register (type: 'plugins' | 'decorators' | 'routes', data: []) {
    if (this.server) {
      throw new Error('ERR_SERVICE_FASTIFY_RUNNING_AND INITIALIZED')
    }
    this.mem[type] = this.mem[type].concat(data)
  }

  _start (cb: (err?: Error | null, results?: any) => void): void {
    async.series(
      [
        next => {
          super._stop(next)
        },
        async () => {
          this.startServer()
        }
      ],
      cb
    )
  }

  underPressureConfig = () => {
    return {
      healthCheck: async function () {
        // TODO: Add database connection check
        return true
      },
      message: 'Under Pressure 😯',
      exposeStatusRoute: '/status',
      healthCheckInterval: 5000
    }
  }

  swaggerConfig = () => {
    return {
      routePrefix: '/documentation',
      swagger: {
        info: {
          title: 'Fastify Boilerplate',
          description:
            'A full blown production ready boilerplate to build APIs with Fastify',
          version: '1.0.0'
        },
        consumes: ['application/json'],
        produces: ['application/json']
      },
      exposeRoute: true,
      host: 'localhost'
    }
  }

  fastifyStaticConfig = () => {
    console.log(path.join(__dirname, '../public'))
    return {
      root: path.join(__dirname, '../public'),
      prefix: '/public/' // specify a prefix for your static file URLs
    }
  }

  _stop (cb: (err?: Error | null, results?: any) => void): void {
    async.series(
      [
        next => {
          super._stop(next)
        },
        async () => {
          if (this.server) {
            await this.server.close()
          }
        }
      ],
      cb
    )
  }
}
export default FastifyService

import ServiceBase from 'sarafa-svc-base';
import { FastifyInstance } from 'fastify';
declare class FastifyService extends ServiceBase {
    server: FastifyInstance | undefined;
    handler: any;
    opts: {
        logger: boolean;
        trustProxy: boolean;
        disableRequestLogging: boolean;
        port: number;
    };
    mem: {
        plugins: Array<any>;
        routes: Array<any>;
        decorators: Array<any>;
    };
    constructor(handler: any);
    startServer(): Promise<string>;
    register(type: 'plugins' | 'decorators' | 'routes', data: []): void;
    _start(cb: (err?: Error | null, results?: any) => void): void;
    underPressureConfig: () => {
        healthCheck: () => Promise<boolean>;
        message: string;
        exposeStatusRoute: string;
        healthCheckInterval: number;
    };
    swaggerConfig: () => {
        routePrefix: string;
        swagger: {
            info: {
                title: string;
                description: string;
                version: string;
            };
            consumes: string[];
            produces: string[];
        };
        exposeRoute: boolean;
        host: string;
    };
    fastifyStaticConfig: () => {
        root: string;
        prefix: string;
    };
    _stop(cb: (err?: Error | null, results?: any) => void): void;
}
export default FastifyService;

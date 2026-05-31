// Auto-generated client exports (available after running `npm run generate`)
export * from './client/index';

// Auto-generated Zod schemas for runtime validation
export * from './client/zod.gen';

// Setup
export { setupOpencals, type SetupOptions } from './setup';

// Interceptors
export {
	apiKeyInterceptor,
	createLoggingRequestInterceptor,
	createLoggingResponseInterceptor,
	type LoggingOptions,
	errorHandlerInterceptor,
	OpencalsApiError,
} from './interceptors';

// Helpers
export {
	toLocalFromUtc,
	toUtcFromLocal,
	mergeTimeIntervals,
	formatDuration,
	formatPrice,
	type TimeInterval,
} from './helpers';

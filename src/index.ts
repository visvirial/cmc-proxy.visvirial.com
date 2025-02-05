import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { CryptocurrencyMap }  from './endpoints/CryptocurrencyMap';
import { CryptocurrencyInfo } from './endpoints/CryptocurrencyInfo';

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: '/',
});

// Register OpenAPI endpoints
openapi.get('/v1/cryptocurrency/map', CryptocurrencyMap);
openapi.get('/v2/cryptocurrency/info', CryptocurrencyInfo);

// Export the Hono app
export default app;

import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { CryptocurrencyMap }  from './endpoints/CryptocurrencyMap';
import { CryptocurrencyInfo } from './endpoints/CryptocurrencyInfo';
import { CoinMarketCap } from './CoinMarketCap';

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: '/',
});

// Register OpenAPI endpoints
openapi.get('/v1/cryptocurrency/map', CryptocurrencyMap);
openapi.get('/v2/cryptocurrency/info', CryptocurrencyInfo);

const scheduled = async (event, env, ctx) => {
	const cmc = new CoinMarketCap(env);
	{
		const timeout = 60 * 60 * 1000;
		const { time } = await cmc.getMapAll();
		if(Date.now() - time > timeout) {
			await cmc.refreshMapAll();
		}
	}
	{
		const timeout = 60 * 60 * 1000;
		const { time } = await cmc.getMetadataAll();
		if(Date.now() - time > timeout) {
			await cmc.refreshMetadataAll();
		}
	}
};

// Export the Hono app
export default {
	fetch: app.fetch,
	scheduled,
};

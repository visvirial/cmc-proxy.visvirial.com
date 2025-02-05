
import {
	Bool,
	OpenAPIRoute,
 } from 'chanfana';
import { z } from 'zod';
import { Context } from 'hono';

import {
	CryptocurrencyMapRequest,
} from '../types';
import {
	getResponseStatus,
} from '../util';
import { CoinMarketCap } from 'CoinMarketCap';

export class CryptocurrencyMap extends OpenAPIRoute {
	
	schema = {
		tags: ['Cryptocurrency'],
		summary: 'CoinMarketCap ID Map',
		request: {
			query: CryptocurrencyMapRequest,
		},
		responses: {
			'200': {
				description: 'Returns a mapping of all cryptocurrencies to unique CoinMarketCap ids. Per our Best Practices we recommend utilizing CMC ID instead of cryptocurrency symbols to securely identify cryptocurrencies with our other endpoints and in your own application logic. Each cryptocurrency returned includes typical identifiers such as name, symbol, and token_address for flexible mapping to id.',
				content: {
					'application/json': {
						schema: z.any(),
					},
				},
			},
		},
	};
	
	async handle(c: Context) {
		const start = Date.now();
		const data = await this.getValidatedData<typeof this.schema>();
		const cmc = new CoinMarketCap(c.env);
		let { time, data: map } = await cmc.getMapAll(data.query.listing_status);
		// Sort.
		if(data.query.sort === 'id') {
			map.sort((a, b) => a.id - b.id);
		} else {
			map.sort((a, b) => a.rank - b.rank);
		}
		// Handle symbol.
		if(data.query.symbol) {
			const symbols = data.query.symbol.split(',');
			map = map.filter((item) => symbols.includes(item.symbol));
		}
		// Handle start and limit.
		map = map.slice(data.query.start - 1, data.query.start - 1 + data.query.limit);
		// Handle aux.
		const aux = data.query.aux.split(',');
		for(const item of map) {
			if(!aux.includes('platform')) {
				delete item.platform;
			}
			if(!aux.includes('first_historical_data')) {
				delete item.first_historical_data;
			}
			if(!aux.includes('last_historical_data')) {
				delete item.last_historical_data;
			}
			if(!aux.includes('is_active')) {
				delete item.is_active;
			}
			if(!aux.includes('status')) {
				delete item.status;
			}
		}
		return {
			data: map,
			status: getResponseStatus(
				time,
				Date.now() - start,
			),
		};
	}
	
}

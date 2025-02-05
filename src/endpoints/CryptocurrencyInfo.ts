
import {
	Bool,
	OpenAPIRoute,
 } from 'chanfana';
import { z } from 'zod';
import { Context } from 'hono';

import {
	CryptocurrencyInfoRequest,
} from '../types';
import {
	getResponseStatus,
} from '../util';
import { CoinMarketCap } from 'CoinMarketCap';

export class CryptocurrencyInfo extends OpenAPIRoute {

	schema = {
		tags: ['Cryptocurrency'],
		summary: 'Metadata v2',
		request: {
			query: CryptocurrencyInfoRequest,
		},
		responses: {
			'200': {
				description: 'Returns all static metadata available for one or more cryptocurrencies. This information includes details like logo, description, official website URL, social links, and links to a cryptocurrency\'s technical documentation.',
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
		const { time, data: metadata } = await cmc.getMetadataAll();
		const respond = (name: string, key: string) => {
			const result: { [id: string]: any } = {};
			const keys = key.split(',');
			keys.map((k) => {
				const meta: any = Object.values(metadata).find((item) => item[name] == k);
				if(meta) {
					result[meta.id] = meta;
				} else if(!data.query.skip_invalild) {
					c.status(400);
					return {
						status: getResponseStatus(
							Date.now(),
							Date.now() - start,
							400,
							`Invalid ${name}: ${k}`,
						),
					};
				}
			});
			const aux = data.query.aux.split(',');
			for(const data of Object.values(result)) {
				if(!aux.includes('urls')) {
					delete data['urls'];
				}
				if(!aux.includes('logo')) {
					delete data['logo'];
				}
				if(!aux.includes('description')) {
					delete data['description'];
				}
				if(!aux.includes('tags')) {
					delete data['tags'];
				}
				if(!aux.includes('platform')) {
					delete data['platform'];
				}
				if(!aux.includes('date_added')) {
					delete data['date_added'];
				}
				if(!aux.includes('notice')) {
					delete data['notice'];
				}
				if(!aux.includes('status')) {
					delete data['status'];
				}
			}
			return {
				data: result,
				status: getResponseStatus(
					time,
					Date.now() - start,
				),
			};
		};
		if(data.query.id) {
			return respond('id', data.query.id);
		}
		if(data.query.slug) {
			return respond('slug', data.query.slug);
		}
		if(data.query.symbol) {
			return respond('symbol', data.query.symbol);
		}
		if(data.query.address) {
			return respond('address', data.query.address);
		}
		return {
			status: getResponseStatus(
				Date.now(),
				Date.now() - start,
				400,
				'At least one of id, slug, symbol, or address must be provided.',
			),
		};
	}
	
}

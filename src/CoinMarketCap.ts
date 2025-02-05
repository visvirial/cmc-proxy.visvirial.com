
import { Context } from 'hono';
import { env } from 'hono/adapter'

export class CoinMarketCap {
	
	constructor(
		public readonly c: Context,
		public readonly endpointUrl = 'https://pro-api.coinmarketcap.com',
	) {
	}
	
	private async _getCached(kvKey: string, expire: number, fetchFunc: () => Promise<any>) {
		// Try to fetch from KV.
		const json = await this.c.env.COINMARKETCAP_PROXY.get(kvKey);
		if(json !== null) {
			const data = JSON.parse(json);
			if(data.time > Date.now() - expire) {
				return data.data;
			}
		}
		// Fetch.
		const data = await fetchFunc();
		// Save to KV.
		await this.c.env.COINMARKETCAP_PROXY.put(kvKey, JSON.stringify({
			time: Date.now(),
			data,
		}));
		return data;
	}
	
	private async _getMapAll(listing_status = 'active') {
		const map = [];
		const limit = 5000;
		for(let start=1; ; start+=limit) {
			const result = await this.fetch('/v1/cryptocurrency/map', {
				listing_status,
				start,
				limit,
				aux: 'platform,first_historical_data,last_historical_data,is_active,status',
			});
			if(result.length === 0) {
				break;
			}
			map.push(...result);
		}
		return map;
	}
	
	public async getMapAll(listing_status = 'active') {
		return await this._getCached(`mapAll:${listing_status}`, 60 * 60 * 1000, () => this._getMapAll(listing_status));
	}
	
	private async _getMetadataAll() {
		// Get all IDs.
		const map = await this.getMapAll();
		const ids = map.map((item) => item.id);
		// Fetch metadata.
		let metadata = {};
		const batchSize = 500;
		for(let i=0; i<ids.length; i+=batchSize) {
			const result = await this.fetch('/v2/cryptocurrency/info', {
				id: ids.slice(i, i+batchSize).join(','),
				aux: 'urls,logo,description,tags,platform,date_added,notice,status',
			});
			metadata = { ...metadata, ...result };
		}
		return metadata;
	}
	
	public async getMetadataAll() {
		return await this._getCached('metadataAll', 60 * 60 * 1000, () => this._getMetadataAll());
	}
	
	public async fetch(path: string, params: any = {}): Promise<any> {
		const { CMC_API_KEY } = env<{ CMC_API_KEY: string }>(this.c);
		const query = new URLSearchParams(params);
		const url = `${this.endpointUrl}${path}?${query.toString()}`;
		const response = await fetch(url, {
			headers: {
				'X-CMC_PRO_API_KEY': CMC_API_KEY,
			},
		});
		if(response.status !== 200) {
			console.log(await response.text());
			console.log(url);
			throw new Error(`Server responded with status ${response.status}`);
		}
		const json: any = await response.json();
		if(json.status.error_code !== 0) {
			throw new Error(json.status.error_message);
		}
		return json.data;
	}
	
}

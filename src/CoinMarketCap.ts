
import { Context } from 'hono';

export interface CacheEntry {
	time: number;
	data: any;
}

export class CoinMarketCap {
	
	constructor(
		public readonly env: any,
		public readonly endpointUrl = 'https://pro-api.coinmarketcap.com',
	) {
	}
	
	private async _setCache(key: string, data: any) {
		await this.env.COINMARKETCAP_PROXY.put(key, JSON.stringify({
			time: Date.now(),
			data,
		}));
	}
	
	private async _getCache(key: string): Promise<null | CacheEntry> {
		const json = await this.env.COINMARKETCAP_PROXY.get(key);
		if(json === null) {
			return null;
		}
		return JSON.parse(json);
	}
	
	private async _fetchMapAll(listing_status = 'active') {
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
	
	public async refreshMapAll(listing_status = 'active') {
		const map = await this._fetchMapAll(listing_status);
		await this._setCache(`mapAll:${listing_status}`, map);
	}
	
	public async getMapAll(listing_status = 'active') {
		return await this._getCache(`mapAll:${listing_status}`);
	}
	
	private async _getMetadataAll() {
		// Get all IDs.
		const map = await this.getMapAll();
		const ids = map.data.map((item: any) => item.id);
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
	
	public async refreshMetadataAll() {
		const metadata = await this._getMetadataAll();
		await this._setCache('metadataAll', metadata);
	}
	
	public async getMetadataAll() {
		return this._getCache('metadataAll');
	}
	
	public async fetch(path: string, params: any = {}): Promise<any> {
		//const { CMC_API_KEY } = env<{ CMC_API_KEY: string }>(this.c);
		const CMC_API_KEY = this.env.CMC_API_KEY;
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

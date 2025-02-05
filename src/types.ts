
import { z } from 'zod';

export const CryptocurrencyMapRequest = z.object({
	/*
	listing_status: z.string()
		.includes('active')
		.includes('inactive')
		.includes('untracked')
		.optional()
		.default('active')
		,
	*/
	listing_status: z.union([
		z.literal('active'),
		z.literal('inactive'),
		z.literal('untracked'),
	])
		.optional()
		.default('active'),
	start: z.number()
		.optional()
		.default(1)
		,
	limit: z.number()
		.optional()
		.default(5000)
		,
	sort: z.string()
		.optional()
		.default('id')
		,
	symbol: z.string()
		.optional()
		,
	aux: z.string()
		.optional()
		.default('platform,first_historical_data,last_historical_data,is_active')
		,
});

export const CryptocurrencyInfoRequest = z.object({
	id: z.string()
		.optional()
		,
	slug: z.string()
		.optional()
		,
	symbol: z.string()
		.optional()
		,
	address: z.string()
		.optional()
		,
	skip_invalild: z.boolean()
		.optional()
		.default(false)
		,
	aux: z.string()
		.optional()
		.default('urls,logo,description,tags,platform,date_added,notice')
		,
});


export const getResponseStatus = (
	time: number,
	elapsed: number,
	error_code: number = 0,
	error_message: string = '',
) => {
	return {
		timestamp: new Date(time).toISOString(),
		error_code,
		error_message,
		elapsed,
		credit_count: 0,
		notice: '',
	};
};

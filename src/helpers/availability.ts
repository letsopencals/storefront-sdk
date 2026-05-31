/**
 * Availability helpers for working with time slots and date ranges.
 * Ported from frontend/apps/storefront/lib/availability-helpers.ts
 */

export interface TimeInterval {
	start: Date;
	end: Date;
}

/**
 * Convert UTC date+time strings to a local Date in the given timezone.
 *
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:mm:ss format
 * @param timezone - Target timezone (e.g., "America/New_York")
 * @returns Date object representing the local time
 */
export function toLocalFromUtc(date: string, time: string, timezone: string): Date {
	const utcDate = new Date(`${date}T${time}Z`);
	// Use Intl to get the offset for the target timezone
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});
	const parts = formatter.formatToParts(utcDate);
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';

	return new Date(
		parseInt(get('year')),
		parseInt(get('month')) - 1,
		parseInt(get('day')),
		parseInt(get('hour')),
		parseInt(get('minute')),
		parseInt(get('second')),
	);
}

/**
 * Convert local date+time in a given timezone to UTC strings.
 *
 * @param date - Date in YYYY-MM-DD format (local)
 * @param time - Time in HH:mm:ss format (local)
 * @param timezone - Source timezone
 * @returns Object with UTC date and time strings
 */
export function toUtcFromLocal(
	date: string,
	time: string,
	timezone: string,
): { date: string; time: string } {
	// Create a date string that Intl can parse in the target timezone
	const [year, month, day] = date.split('-').map(Number);
	const [hours, minutes, seconds] = time.split(':').map(Number);

	// Use a formatter to find the UTC offset for this local time
	const localDate = new Date(year, month - 1, day, hours, minutes, seconds);
	const utcFormatter = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'UTC',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});

	// Calculate offset by comparing local interpretation with UTC
	const tzFormatter = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});

	// Find a UTC timestamp where formatting in the target tz gives our local time
	// Start with a naive guess
	const guess = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
	const formatted = tzFormatter.format(guess);
	const [datePart, timePart] = formatted.split(', ');

	// Parse what the guess looks like in the target timezone
	const [gYear, gMonth, gDay] = datePart.split('-').map(Number);
	const [gHour, gMin, gSec] = timePart.split(':').map(Number);

	// Calculate the difference and adjust
	const guessLocal = new Date(gYear, gMonth - 1, gDay, gHour, gMin, gSec);
	const diff = localDate.getTime() - guessLocal.getTime();
	const corrected = new Date(guess.getTime() + diff);

	const utcParts = utcFormatter.formatToParts(corrected);
	const get = (type: string) => utcParts.find((p) => p.type === type)?.value ?? '00';

	return {
		date: `${get('year')}-${get('month')}-${get('day')}`,
		time: `${get('hour')}:${get('minute')}:${get('second')}`,
	};
}

/**
 * Merge overlapping or adjacent time intervals.
 */
export function mergeTimeIntervals(intervals: TimeInterval[]): TimeInterval[] {
	if (intervals.length === 0) return [];

	const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
	const merged: TimeInterval[] = [];
	let current = { start: new Date(sorted[0].start), end: new Date(sorted[0].end) };

	for (let i = 1; i < sorted.length; i++) {
		const interval = sorted[i];
		if (interval.start.getTime() <= current.end.getTime()) {
			if (interval.end.getTime() > current.end.getTime()) {
				current.end = new Date(interval.end);
			}
		} else {
			merged.push(current);
			current = { start: new Date(interval.start), end: new Date(interval.end) };
		}
	}
	merged.push(current);

	return merged;
}

/**
 * Format duration in seconds to human-readable string.
 *
 * @example
 * formatDuration(3600) // "1 hour"
 * formatDuration(5400) // "1 hour 30 minutes"
 * formatDuration(86400) // "1 day"
 */
export function formatDuration(seconds: number): string {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	const parts: string[] = [];
	if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
	if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
	if (minutes > 0 && days === 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

	return parts.join(' ') || '0 minutes';
}

/**
 * Format a price with currency.
 *
 * @example
 * formatPrice(29.99, 'USD') // "$29.99"
 * formatPrice(0, 'USD') // "Free"
 */
export function formatPrice(amount: number, currency: string, locale: string = 'en-US'): string {
	if (amount === 0) return 'Free';

	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
	}).format(amount);
}

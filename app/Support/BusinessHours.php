<?php

namespace App\Support;

use App\Models\Holiday;
use Carbon\CarbonInterface;

/**
 * Deadlines counted in working time: configured weekdays and hours (config
 * app.business_hours), skipping holidays.
 */
final class BusinessHours
{
    /**
     * The moment $amount working hours or working days after $from. A working day is one
     * day's working hours. With business hours off, every hour counts (a day is 24 hours).
     *
     * @param  'hours'|'days'  $unit
     */
    public static function add(CarbonInterface $from, int $amount, string $unit): CarbonInterface
    {
        /** @var array{enabled: bool, days: list<int>, start: string, end: string} $config */
        $config = config('app.business_hours');

        if (! $config['enabled']) {
            return $from->addHours($unit === 'days' ? $amount * 24 : $amount);
        }

        $dayMinutes = (int) $from->setTimeFromTimeString($config['start'])->diffInMinutes($from->setTimeFromTimeString($config['end']));
        $remaining = $unit === 'days' ? $amount * $dayMinutes : $amount * 60;
        $holidays = array_flip(Holiday::pluck('date')->map(fn (CarbonInterface $d): string => $d->toDateString())->all());
        $at = $from;

        // ponytail: walks day by day; fine for SLAs of days or weeks, not for years.
        for ($guard = 0; $guard < 3660; $guard++) {
            $start = $at->setTimeFromTimeString($config['start']);
            $end = $at->setTimeFromTimeString($config['end']);

            if (in_array($at->isoWeekday(), $config['days'], true) && ! isset($holidays[$at->toDateString()]) && $at < $end) {
                $at = $at->max($start);
                $available = (int) $at->diffInMinutes($end);

                if ($remaining <= $available) {
                    return $at->addMinutes($remaining);
                }

                $remaining -= $available;
            }

            $at = $at->addDay()->setTimeFromTimeString($config['start']);
        }

        return $at;
    }
}

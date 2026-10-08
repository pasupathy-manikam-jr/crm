<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('cases:escalate')->everyFifteenMinutes()->withoutOverlapping();
Schedule::command('contracts:remind')->dailyAt('07:10');
// Shared hosting has no queue daemon: drain the queue (webhooks) every minute from cron.
Schedule::command('queue:work --stop-when-empty --max-time=50 --tries=3')->everyMinute()->withoutOverlapping();
Schedule::command('mail:sync')->everyFiveMinutes()->withoutOverlapping();

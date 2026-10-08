<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\SupportCase;
use App\Models\User;
use App\Notifications\CaseEscalated;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

#[Signature('cases:escalate')]
#[Description('Mark open cases past their SLA as escalated and notify the owner and team managers')]
class EscalateCases extends Command
{
    public function handle(): int
    {
        $count = 0;

        SupportCase::breached()->whereNull('escalated_at')->with('owner')->each(function (SupportCase $case) use (&$count): void {
            $case->escalated_at = now();
            $case->save();

            $owner = $case->owner;
            $managers = $owner?->team_id === null ? collect() : User::query()->role(UserRole::SalesManager->value)
                ->where('team_id', $owner->team_id)->whereKeyNot($owner->id)->get();

            Notification::send($managers->prepend($owner)->filter(), new CaseEscalated($case));
            $count++;
        });

        $this->info("Escalated {$count} case(s).");

        return self::SUCCESS;
    }
}

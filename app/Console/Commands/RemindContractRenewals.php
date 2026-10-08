<?php

namespace App\Console\Commands;

use App\Enums\ActivityType;
use App\Enums\ContractStatus;
use App\Models\Activity;
use App\Models\Contract;
use App\Notifications\ContractRenewalDue;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('contracts:remind')]
#[Description('Remind owners of contracts entering their renewal notice window, and expire ended ones')]
class RemindContractRenewals extends Command
{
    public function handle(): int
    {
        $reminded = 0;

        Contract::dueForRenewal()->whereNull('reminded_at')->with(['owner', 'account:id,name'])->each(function (Contract $contract) use (&$reminded): void {
            Activity::create([
                'type' => ActivityType::Task,
                'subject' => "Renew {$contract->name}",
                'due_at' => $contract->end_date->subDays(7)->max(today())->setTime(9, 0),
                'owner_id' => $contract->owner_id,
                'regarding_type' => $contract->getMorphClass(),
                'regarding_id' => $contract->id,
            ]);
            $contract->owner?->notify(new ContractRenewalDue($contract));
            $contract->reminded_at = now();
            $contract->save();
            $reminded++;
        });

        $expired = 0;

        Contract::where('status', ContractStatus::Active)->where('end_date', '<', today())->each(function (Contract $contract) use (&$expired): void {
            $contract->update(['status' => ContractStatus::Expired]);
            $expired++;
        });

        $this->info("Reminded {$reminded}, expired {$expired} contract(s).");

        return self::SUCCESS;
    }
}

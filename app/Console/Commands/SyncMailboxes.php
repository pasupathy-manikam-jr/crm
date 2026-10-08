<?php

namespace App\Console\Commands;

use App\Actions\Mail\SyncMailbox;
use App\Models\Mailbox;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('mail:sync {--mailbox= : Only this mailbox id}')]
#[Description('Read new email from active mailboxes into cases, timelines and draft quotes')]
class SyncMailboxes extends Command
{
    public function handle(SyncMailbox $sync): int
    {
        $mailboxes = Mailbox::where('active', true)
            ->when($this->option('mailbox'), fn ($q, $id) => $q->whereKey((int) $id))
            ->get();

        foreach ($mailboxes as $mailbox) {
            $filed = $sync->handle($mailbox);
            $this->line("{$mailbox->name}: {$filed} new".($mailbox->last_error ? " (error: {$mailbox->last_error})" : ''));
        }

        return self::SUCCESS;
    }
}

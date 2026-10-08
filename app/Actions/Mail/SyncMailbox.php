<?php

namespace App\Actions\Mail;

use App\Models\Mailbox;
use App\Support\Mail\ImapInbox;
use Illuminate\Support\Str;
use Throwable;

/**
 * Read a mailbox's new messages and file each one. A failure (login, network) is kept on
 * the mailbox for the admin page; messages already filed stay filed.
 */
final class SyncMailbox
{
    public function __construct(private ImapInbox $inbox, private ProcessIncomingEmail $process) {}

    /**
     * @return int How many new emails were filed.
     */
    public function handle(Mailbox $mailbox): int
    {
        $filed = 0;

        try {
            foreach ($this->inbox->fetch($mailbox) as $message) {
                if ($this->process->handle($mailbox, $message) !== null) {
                    $filed++;
                }

                $mailbox->last_uid = max((int) $mailbox->last_uid, $message->uid);
            }

            $mailbox->last_error = null;
        } catch (Throwable $e) {
            report($e);
            $mailbox->last_error = Str::limit($e->getMessage(), 490, '…');
        }

        $mailbox->last_synced_at = now();
        $mailbox->save();

        return $filed;
    }
}

<?php

namespace App\Support\Mail;

use App\Models\Mailbox;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Webklex\PHPIMAP\Attachment;
use Webklex\PHPIMAP\Client;
use Webklex\PHPIMAP\ClientManager;
use Webklex\PHPIMAP\Message;

/**
 * Reads a mailbox over IMAP (webklex/php-imap, no PHP imap extension needed). Messages are
 * left unread on the server.
 *
 * ponytail: password (app password) login only; add XOAUTH2 when Google sign-in is wanted.
 */
class ImapInbox
{
    /** Most messages taken per run; the rest come next run. */
    public const BATCH = 50;

    /**
     * Connect and open the folder; throws with the server's reason when it fails.
     */
    public function test(Mailbox $mailbox): void
    {
        $this->client($mailbox)->getFolderByPath($mailbox->folder) ?? throw new \RuntimeException("Folder “{$mailbox->folder}” not found.");
    }

    /**
     * Messages newer than the mailbox's last UID, oldest first. The very first run only
     * looks at the last day, so connecting a mailbox doesn't import years of mail.
     *
     * @return list<IncomingMessage>
     */
    public function fetch(Mailbox $mailbox): array
    {
        $folder = $this->client($mailbox)->getFolderByPath($mailbox->folder)
            ?? throw new \RuntimeException("Folder “{$mailbox->folder}” not found.");
        $query = $folder->query()->leaveUnread()->setFetchOrderAsc()->limit(self::BATCH);

        $messages = $mailbox->last_uid === null
            ? $query->since(now()->subDay())->get()
            : $query->getByUidGreater($mailbox->last_uid);

        $read = [];

        foreach ($messages as $message) {
            $read[] = $this->toIncoming($message);
        }

        return $read;
    }

    private function client(Mailbox $mailbox): Client
    {
        $client = (new ClientManager)->make([
            'host' => $mailbox->host,
            'port' => $mailbox->port,
            'encryption' => $mailbox->encryption === 'none' ? false : $mailbox->encryption,
            'validate_cert' => true,
            'username' => $mailbox->username,
            'password' => $mailbox->password,
            'protocol' => 'imap',
            'timeout' => 30,
        ]);
        $client->connect();

        return $client;
    }

    private function toIncoming(Message $message): IncomingMessage
    {
        $from = $message->getFrom()->first();
        $attachments = [];

        foreach ($message->getAttachments() as $attachment) {
            /** @var Attachment $attachment */
            $attachments[] = [
                'name' => (string) ($attachment->getName() ?: 'attachment'),
                'mime' => $attachment->getMimeType(),
                'content' => (string) $attachment->getContent(),
            ];
        }

        $text = trim($message->getTextBody());
        $date = $message->getDate()->first();

        return new IncomingMessage(
            uid: (int) $message->getUid(),
            messageId: trim((string) $message->getMessageId(), '<> ') ?: 'uid-'.$message->getUid().'@'.Str::random(8),
            inReplyTo: trim((string) $message->get('in_reply_to'), '<> ') ?: null,
            references: trim((string) $message->getReferences()) ?: null,
            fromEmail: Str::lower((string) ($from->mail ?? '')),
            fromName: ($from->personal ?? null) ?: null,
            subject: (string) $message->getSubject() ?: null,
            body: $text !== '' ? $text : trim(strip_tags($message->getHTMLBody())),
            receivedAt: $date ? Carbon::instance($date) : now(),
            attachments: $attachments,
        );
    }
}

<?php

namespace App\Support\Mail;

use Carbon\CarbonInterface;

/**
 * One email as read from a mailbox, independent of the IMAP library.
 */
final readonly class IncomingMessage
{
    /**
     * @param  list<array{name: string, mime: string|null, content: string}>  $attachments
     */
    public function __construct(
        public int $uid,
        public string $messageId,
        public ?string $inReplyTo,
        public ?string $references,
        public string $fromEmail,
        public ?string $fromName,
        public ?string $subject,
        public string $body,
        public CarbonInterface $receivedAt,
        public array $attachments = [],
    ) {}
}

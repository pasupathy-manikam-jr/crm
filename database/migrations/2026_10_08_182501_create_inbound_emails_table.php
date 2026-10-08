<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inbound_emails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mailbox_id')->constrained()->cascadeOnDelete();
            // Message-ID header: never imported twice.
            $table->string('message_id')->unique();
            $table->string('in_reply_to')->nullable()->index();
            $table->text('references')->nullable();
            $table->string('from_email')->index();
            $table->string('from_name')->nullable();
            $table->string('subject')->nullable();
            $table->mediumText('body')->nullable();
            $table->dateTime('received_at')->index();
            // matched (to a contact or lead), unmatched, or ignored (domain filters).
            $table->string('status', 20)->index();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('support_case_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('quote_id')->nullable()->constrained()->nullOnDelete();
            // Quote extraction: pending, drafted, not_quote, failed, skipped (no API key).
            $table->string('ai_status', 20)->nullable()->index();
            $table->decimal('ai_confidence', 4, 3)->nullable();
            $table->unsignedInteger('ai_input_tokens')->nullable();
            $table->unsignedInteger('ai_output_tokens')->nullable();
            $table->decimal('ai_cost', 10, 6)->nullable();
            $table->string('ai_error', 500)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inbound_emails');
    }
};

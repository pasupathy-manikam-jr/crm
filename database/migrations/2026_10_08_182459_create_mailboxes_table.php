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
        Schema::create('mailboxes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('host');
            $table->unsignedSmallInteger('port')->default(993);
            $table->string('encryption', 10)->default('ssl');
            $table->string('username');
            // Encrypted (an app password for Gmail and most providers).
            $table->text('password');
            $table->string('folder')->default('INBOX');
            $table->boolean('create_cases')->default(false);
            $table->boolean('draft_quotes')->default(false);
            // Owns the cases and leads this mailbox creates.
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();
            // One domain per line; empty allow list = every sender.
            $table->text('allowed_domains')->nullable();
            $table->text('blocked_domains')->nullable();
            $table->boolean('active')->default(false);
            $table->unsignedBigInteger('last_uid')->nullable();
            $table->dateTime('last_synced_at')->nullable();
            $table->string('last_error', 500)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mailboxes');
    }
};

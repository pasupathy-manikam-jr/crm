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
        Schema::create('webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('url', 2048);
            // e.g. ["lead.created", "deal.updated"]
            $table->json('events');
            // Encrypted; signs each delivery (X-OricCRM-Signature).
            $table->text('secret');
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('last_status')->nullable();
            $table->string('last_error', 500)->nullable();
            $table->dateTime('last_sent_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhooks');
    }
};

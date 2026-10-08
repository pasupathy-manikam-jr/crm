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
        Schema::create('support_cases', function (Blueprint $table) {
            $table->id();
            $table->string('number', 20)->unique();
            $table->string('subject');
            $table->text('description')->nullable();
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->string('priority', 20)->default('normal');
            $table->string('status', 20)->default('open')->index();
            $table->dateTime('sla_due_at')->index();
            $table->dateTime('resolved_at')->nullable();
            // Set when the breach notice goes out, so it goes out once.
            $table->dateTime('escalated_at')->nullable();
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();
            $table->json('custom_fields')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_cases');
    }
};

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
        Schema::create('web_forms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Secret part of the public submit URL (/f/<token>).
            $table->string('token', 40)->unique();
            // New leads from this form are owned by this user.
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();
            // Where to send the visitor after submitting; a plain thank-you page when empty.
            $table->string('redirect_url')->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedInteger('submissions')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('web_forms');
    }
};

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
        Schema::create('workflow_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('module', 20);
            // created, updated, or saved (either).
            $table->string('event', 20);
            $table->json('conditions');
            $table->json('actions');
            $table->boolean('active')->default(true);
            $table->unsignedInteger('runs_count')->default(0);
            $table->timestamps();
            $table->index(['module', 'active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_rules');
    }
};

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
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20);
            $table->string('subject');
            $table->text('notes')->nullable();
            $table->dateTime('due_at')->nullable()->index();
            $table->dateTime('done_at')->nullable()->index();
            // The account, contact, lead or deal it's about (morph alias), if any.
            $table->nullableMorphs('regarding');
            // owner_id is the assignee. Restrict: a user who still owns records can't be deleted.
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};

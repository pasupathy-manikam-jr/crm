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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->string('industry')->nullable();
            $table->string('website')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email')->nullable()->index();
            $table->text('billing_address')->nullable();
            $table->text('shipping_address')->nullable();
            // Restrict: a user who still owns records can't be deleted until they're reassigned.
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
        Schema::dropIfExists('accounts');
    }
};

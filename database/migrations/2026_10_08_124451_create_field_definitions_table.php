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
        Schema::create('field_definitions', function (Blueprint $table) {
            $table->id();
            // account, contact, lead or deal (the morph aliases).
            $table->string('entity', 20);
            // Key inside the record's custom_fields JSON; fixed once created.
            $table->string('key', 64);
            $table->string('label');
            $table->string('type', 20);
            $table->json('options')->nullable();
            $table->boolean('required')->default(false);
            $table->unsignedSmallInteger('position')->default(0);
            // Deactivated fields disappear from forms but their stored values are kept.
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['entity', 'key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('field_definitions');
    }
};

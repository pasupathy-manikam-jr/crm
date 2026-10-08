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
        Schema::table('leads', function (Blueprint $table) {
            $table->timestamp('converted_at')->nullable()->after('status');
            $table->foreignId('converted_account_id')->nullable()->after('converted_at')->constrained('accounts')->nullOnDelete();
            $table->foreignId('converted_contact_id')->nullable()->after('converted_account_id')->constrained('contacts')->nullOnDelete();
            $table->foreignId('converted_deal_id')->nullable()->after('converted_contact_id')->constrained('deals')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('converted_deal_id');
            $table->dropConstrainedForeignId('converted_contact_id');
            $table->dropConstrainedForeignId('converted_account_id');
            $table->dropColumn('converted_at');
        });
    }
};

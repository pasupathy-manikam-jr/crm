<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The latest approval decision on a quote (see QuoteApprovalController).
     */
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            // approved or rejected; cleared when the quote is edited.
            $table->string('approval_decision', 20)->nullable()->after('status');
            $table->text('approval_note')->nullable()->after('approval_decision');
            $table->foreignId('approval_by')->nullable()->after('approval_note')->constrained('users')->nullOnDelete();
            $table->dateTime('approval_at')->nullable()->after('approval_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approval_by');
            $table->dropColumn(['approval_decision', 'approval_note', 'approval_at']);
        });
    }
};

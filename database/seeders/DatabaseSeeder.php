<?php

namespace Database\Seeders;

use App\Enums\StageKind;
use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Contract;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Note;
use App\Models\Product;
use App\Models\Stage;
use App\Models\SupportCase;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    /**
     * Seeded accounts, one per role. With DEMO_LOGINS=true the login page also offers
     * them as one-click logins, so never enable that flag on a live server.
     *
     * @var list<array{name: string, email: string, password: string, role: string}>
     */
    public const LOGINS = [
        ['name' => 'Admin', 'email' => 'admin@example.com', 'password' => 'Zx123456', 'role' => 'admin'],
        ['name' => 'Sales manager', 'email' => 'manager@example.com', 'password' => 'Zx123456', 'role' => 'sales-manager'],
        ['name' => 'Sales rep', 'email' => 'rep@example.com', 'password' => 'Zx123456', 'role' => 'sales-rep'],
    ];

    /**
     * The pipeline, in order: name, default probability (%), and whether it closes the deal.
     *
     * @var list<array{string, int, StageKind}>
     */
    private const STAGES = [
        ['Qualification', 10, StageKind::Open],
        ['Needs analysis', 25, StageKind::Open],
        ['Proposal', 50, StageKind::Open],
        ['Negotiation', 75, StageKind::Open],
        ['Won', 100, StageKind::Won],
        ['Lost', 0, StageKind::Lost],
    ];

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $sales = Team::firstOrCreate(['name' => 'Sales']);

        foreach (self::STAGES as $position => [$name, $probability, $kind]) {
            Stage::updateOrCreate(['position' => $position + 1], ['name' => $name, 'probability' => $probability, 'kind' => $kind]);
        }

        foreach (self::LOGINS as $login) {
            $user = User::updateOrCreate(
                ['email' => $login['email']],
                [
                    'name' => $login['name'],
                    'password' => $login['password'],
                    'email_verified_at' => now(),
                    'team_id' => $login['role'] === UserRole::Admin->value ? null : $sales->id,
                ],
            );
            $user->syncRoles([$login['role']]);
        }

        $this->seedDemoRecords();
        $this->seedDemoCases();
        $this->seedDemoContracts();

        if (! Product::exists()) {
            foreach ([
                ['GPS tracker unit', 'TRK-100', 450, 8],
                ['Fleet software licence (per vehicle / year)', 'SW-FLEET', 360, 8],
                ['Installation (per site)', 'SVC-INSTALL', 1200, 0],
                ['Temperature sensor', 'SNS-TEMP', 185, 8],
                ['Annual support plan', 'SVC-SUPPORT', 2400, 8],
                ['On-site training day', 'SVC-TRAIN', 1800, 0],
            ] as [$name, $sku, $price, $tax]) {
                Product::create(['name' => $name, 'sku' => $sku, 'unit_price' => $price, 'tax_rate' => $tax]);
            }
        }
    }

    /**
     * Sample accounts, contacts and leads for each demo login, so every role has
     * something of its own to look at. Skipped once any account exists.
     */
    private function seedDemoRecords(): void
    {
        if (Account::withTrashed()->exists()) {
            return;
        }

        foreach (User::whereIn('email', array_column(self::LOGINS, 'email'))->get() as $owner) {
            $stages = Stage::orderBy('position')->get();
            Account::factory(4)->for($owner, 'owner')->create()->each(function (Account $account) use ($owner, $stages): void {
                $contacts = Contact::factory(2)->for($owner, 'owner')->for($account)->create();
                Deal::factory(2)->for($owner, 'owner')->for($account)->sequence(
                    fn () => ['stage_id' => $stages->random()->id, 'contact_id' => $contacts->random()->id],
                )->create();
            });
            Contact::factory(2)->for($owner, 'owner')->create();
            Lead::factory(5)->for($owner, 'owner')->create();

            // A spread across overdue, today, upcoming, unscheduled and done, about this owner's records.
            $records = collect([...Account::where('owner_id', $owner->id)->get(), ...Lead::where('owner_id', $owner->id)->get()]);
            foreach ([-3, -1, 0, 0, 2, 5, null, -6] as $i => $days) {
                $record = $records->random();
                Activity::factory()->for($owner, 'owner')->create([
                    'due_at' => $days === null ? null : today()->addDays($days)->setTime(9 + $i, 30),
                    'done_at' => $i === 7 ? now()->subDays(5) : null,
                    'regarding_type' => $record->getMorphClass(),
                    'regarding_id' => $record->getKey(),
                ]);
            }

            foreach ($records->random(2) as $record) {
                Note::factory()->for($owner, 'author')->create(['notable_type' => $record->getMorphClass(), 'notable_id' => $record->getKey()]);
            }
        }
    }

    /**
     * Two contracts per demo login: one inside its renewal window, one later in the year.
     */
    private function seedDemoContracts(): void
    {
        if (Contract::withTrashed()->exists()) {
            return;
        }

        foreach (User::whereIn('email', array_column(self::LOGINS, 'email'))->get() as $owner) {
            foreach ([20, 150] as $daysLeft) {
                $account = Account::where('owner_id', $owner->id)->inRandomOrder()->firstOrFail();
                Contract::factory()->for($owner, 'owner')->for($account)->create([
                    'contact_id' => $account->contacts()->value('id'),
                    'start_date' => today()->addDays($daysLeft)->subYear()->toDateString(),
                    'end_date' => today()->addDays($daysLeft)->toDateString(),
                ]);
            }
        }
    }

    /**
     * A few cases per demo login: some within SLA, one past it, one resolved.
     */
    private function seedDemoCases(): void
    {
        if (SupportCase::withTrashed()->exists()) {
            return;
        }

        foreach (User::whereIn('email', array_column(self::LOGINS, 'email'))->get() as $owner) {
            $accounts = Account::where('owner_id', $owner->id)->get();

            foreach ([['urgent', 1], ['high', 30], ['normal', 2], ['low', 50]] as $i => [$priority, $hoursAgo]) {
                $account = $accounts->random();
                $case = SupportCase::factory()->for($owner, 'owner')->for($account)->create([
                    'priority' => $priority,
                    'contact_id' => $account->contacts()->value('id'),
                    'created_at' => now()->subHours($hoursAgo),
                ]);

                if ($i === 3) {
                    $case->update(['status' => 'resolved']);
                }
            }
        }
    }
}

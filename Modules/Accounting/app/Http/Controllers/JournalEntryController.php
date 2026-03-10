<?php

namespace Modules\Accounting\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;
use Modules\Accounting\Services\AccountingService;
use Yajra\DataTables\Facades\DataTables;

class JournalEntryController extends Controller
{
    public function __construct(private AccountingService $accounting) {}

    public function index()
    {
        return Inertia::render('admin/accounting/journals/index');
    }

    public function datatable(): JsonResponse
    {
        $query = JournalEntry::with('creator')->select('journal_entries.*');

        return DataTables::of($query)
            ->addColumn('creator_name', fn ($e) => $e->creator?->name ?? '—')
            ->addColumn('total_debit', fn ($e) => (float) $e->lines->sum('debit'))
            ->make(true);
    }

    public function create()
    {
        return Inertia::render('admin/accounting/journals/create', [
            'accounts'  => Account::where('is_active', true)->orderBy('code')->get(['id', 'code', 'name']),
            'reference' => $this->accounting->generateReferenceNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date'                 => 'required|date',
            'reference_number'     => 'required|string|unique:journal_entries,reference_number',
            'description'          => 'required|string|max:500',
            'lines'                => 'required|array|min:2',
            'lines.*.account_id'   => 'required|exists:accounts,id',
            'lines.*.debit'        => 'required|numeric|min:0',
            'lines.*.credit'       => 'required|numeric|min:0',
            'lines.*.description'  => 'nullable|string|max:255',
        ]);

        $totalDebit  = collect($request->lines)->sum('debit');
        $totalCredit = collect($request->lines)->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.001) {
            return back()->withErrors([
                'lines' => sprintf(
                    'Total debits (%.2f) must equal total credits (%.2f).',
                    $totalDebit,
                    $totalCredit
                ),
            ])->withInput();
        }

        DB::transaction(function () use ($request) {
            $entry = JournalEntry::create([
                'date'             => $request->date,
                'reference_number' => $request->reference_number,
                'description'      => $request->description,
                'status'           => 'draft',
                'created_by'       => $request->user()->id,
            ]);

            foreach ($request->lines as $line) {
                JournalLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id'       => $line['account_id'],
                    'description'      => $line['description'] ?? null,
                    'debit'            => (float) $line['debit'],
                    'credit'           => (float) $line['credit'],
                ]);
            }
        });

        return redirect()->route('admin.accounting.journals.index')
            ->with('success', 'Journal entry created.');
    }

    public function show(JournalEntry $journalEntry)
    {
        return Inertia::render('admin/accounting/journals/show', [
            'entry' => $journalEntry->load(['lines.account', 'creator']),
        ]);
    }

    public function post(JournalEntry $journalEntry)
    {
        try {
            $this->accounting->postEntry($journalEntry);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['entry' => $e->getMessage()]);
        }

        return back()->with('success', 'Entry posted successfully.');
    }

    public function void(JournalEntry $journalEntry, Request $request)
    {
        try {
            $this->accounting->voidEntry($journalEntry, $request->user()->id);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['entry' => $e->getMessage()]);
        }

        return back()->with('success', 'Entry voided and reversing entry created.');
    }
}

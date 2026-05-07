<?php

namespace Modules\Admin\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Yajra\DataTables\Facades\DataTables;

class AdminUserController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/users/index');
    }

    public function datatable(): JsonResponse
    {
        $adminRoles = Role::permission('admin.access')->pluck('name');
        $query = User::role($adminRoles)->with('roles')->select('users.*');

        return DataTables::of($query)
            ->addColumn('role', fn ($user) => $user->getRoleNames()->implode(', '))
            ->addColumn('actions', fn ($user) => $user->id)
            ->make(true);
    }

    public function create()
    {
        $roles = Role::where('name', '!=', 'customer')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/users/create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role'     => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => $validated['password'],
        ]);

        $user->assignRole($validated['role']);

        return redirect()->route('admin.users.index')->with('success', 'Admin user created.');
    }

    public function edit(User $user)
    {
        $roles = Role::where('name', '!=', 'customer')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/users/edit', [
            'user'     => $user->only('id', 'name', 'email'),
            'userRole' => $user->getRoleNames()->first(),
            'roles'    => $roles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8|confirmed',
            'role'     => 'required|string|exists:roles,name',
        ]);

        $user->update(['name' => $validated['name'], 'email' => $validated['email']]);

        if (!empty($validated['password'])) {
            $user->update(['password' => $validated['password']]);
        }

        $user->syncRoles([$validated['role']]);

        return redirect()->route('admin.users.index')->with('success', 'Admin user updated.');
    }

    public function destroy(User $user)
    {
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'Admin user deleted.');
    }
}

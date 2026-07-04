<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Yajra\DataTables\Facades\DataTables;

class RoleController extends Controller
{
    private const SYSTEM_ROLES = ['admin', 'customer'];

    public function index()
    {
        return Inertia::render('admin/roles/index');
    }

    public function datatable(): JsonResponse
    {
        $query = Role::withCount('users')->where('name', '!=', 'customer');

        return DataTables::of($query)
            ->addColumn('permissions_count', fn ($role) => $role->permissions()->count())
            ->addColumn('actions', fn ($role) => ['id' => $role->id, 'name' => $role->name])
            ->make(true);
    }

    public function create()
    {
        $permissions = Permission::all()
            ->groupBy(fn ($p) => explode('.', $p->name)[0]);

        return Inertia::render('admin/roles/create', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $permissions = array_unique(array_merge(['admin.access'], $validated['permissions'] ?? []));
        $this->authorizePermissionGrant($request, $permissions);

        $role = Role::create(['name' => $validated['name'], 'guard_name' => 'web']);
        $role->syncPermissions($permissions);

        return redirect()->route('admin.roles.index')->with('success', 'Role created successfully.');
    }

    public function edit(Role $role)
    {
        if (in_array($role->name, self::SYSTEM_ROLES, true)) {
            return redirect()->route('admin.roles.index')
                ->with('error', 'System roles cannot be edited.');
        }

        $permissions = Permission::all()
            ->groupBy(fn ($p) => explode('.', $p->name)[0]);

        $rolePermissions = $role->permissions->pluck('name')->toArray();

        return Inertia::render('admin/roles/edit', [
            'role' => $role->only('id', 'name'),
            'permissions' => $permissions,
            'rolePermissions' => $rolePermissions,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        if (in_array($role->name, self::SYSTEM_ROLES, true)) {
            return back()->withErrors(['error' => 'System roles cannot be edited.']);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($role->id)],
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $permissions = array_unique(array_merge(['admin.access'], $validated['permissions'] ?? []));
        $this->authorizePermissionGrant($request, $permissions);

        $role->update(['name' => $validated['name']]);
        $role->syncPermissions($permissions);

        return redirect()->route('admin.roles.index')->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role)
    {
        if (in_array($role->name, self::SYSTEM_ROLES, true)) {
            return back()->with('error', 'System roles cannot be deleted.');
        }

        $role->delete();

        return redirect()->route('admin.roles.index')->with('success', 'Role deleted successfully.');
    }

    /**
     * Prevent an actor from granting a role permissions they don't hold themselves —
     * otherwise a non-admin with roles.edit could self-escalate via a custom role.
     */
    private function authorizePermissionGrant(Request $request, array $permissions): void
    {
        $actorPermissions = $request->user()->getAllPermissions()->pluck('name');
        $disallowed = collect($permissions)->diff($actorPermissions);

        if ($disallowed->isNotEmpty()) {
            abort(403, 'You cannot grant permissions you do not hold yourself: '.$disallowed->implode(', '));
        }
    }
}

<?php

namespace Modules\Ordering\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Modules\Ordering\Models\Address;

class AddressService
{
    public function create(User $user, array $data): Address
    {
        return DB::transaction(function () use ($user, $data) {
            $shouldBeDefault = ($data['is_default'] ?? false) || $user->addresses()->doesntExist();

            if ($shouldBeDefault) {
                $user->addresses()->where('is_default', true)->update(['is_default' => false]);
            }

            return $user->addresses()->create([...$data, 'is_default' => $shouldBeDefault]);
        });
    }

    public function update(Address $address, array $data): Address
    {
        return DB::transaction(function () use ($address, $data) {
            if ($data['is_default'] ?? false) {
                $address->user->addresses()
                    ->where('id', '!=', $address->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            $address->update($data);

            return $address;
        });
    }

    public function setDefault(Address $address): void
    {
        DB::transaction(function () use ($address) {
            $address->user->addresses()
                ->where('id', '!=', $address->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);

            $address->update(['is_default' => true]);
        });
    }

    public function delete(Address $address): void
    {
        DB::transaction(function () use ($address) {
            $wasDefault = $address->is_default;
            $user = $address->user;

            $address->delete();

            if ($wasDefault) {
                $user->addresses()->latest()->first()?->update(['is_default' => true]);
            }
        });
    }
}

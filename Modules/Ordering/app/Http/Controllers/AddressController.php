<?php

namespace Modules\Ordering\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Ordering\Models\Address;
use Modules\Ordering\Services\AddressService;
use Modules\Ordering\Services\ShippingService;

class AddressController extends Controller
{
    public function __construct(private AddressService $addresses) {}

    public function index(Request $request)
    {
        return Inertia::render('addresses/index', [
            'addresses' => $request->user()->addresses,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        $this->addresses->create($request->user(), $validated);

        return back()->with('success', 'Address saved.');
    }

    public function update(Request $request, Address $address)
    {
        abort_if($address->user_id !== $request->user()->id, 403);

        $validated = $request->validate($this->rules());

        $this->addresses->update($address, $validated);

        return back()->with('success', 'Address updated.');
    }

    public function destroy(Request $request, Address $address)
    {
        abort_if($address->user_id !== $request->user()->id, 403);

        $this->addresses->delete($address);

        return back()->with('success', 'Address deleted.');
    }

    public function setDefault(Request $request, Address $address)
    {
        abort_if($address->user_id !== $request->user()->id, 403);

        $this->addresses->setDefault($address);

        return back()->with('success', 'Default address updated.');
    }

    private function rules(): array
    {
        return [
            'label' => 'nullable|string|max:255',
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:30',
            'street_address' => 'required|string',
            'city' => 'required|string|in:'.implode(',', ShippingService::CITIES),
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'is_default' => 'nullable|boolean',
        ];
    }
}

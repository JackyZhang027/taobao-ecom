<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;

class StoreFeature extends Model
{
    protected $fillable = ['sort_order', 'icon', 'title', 'description', 'is_active'];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];
}

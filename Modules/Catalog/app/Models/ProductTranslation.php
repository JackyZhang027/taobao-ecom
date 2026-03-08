<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductTranslation extends Model
{
    protected $fillable = [
        'product_id',
        'locale',
        'name',
        'description',
        'meta_title',
        'meta_description',
        'meta_keywords',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageTranslation extends Model
{
    protected $fillable = [
        'page_id',
        'locale',
        'title',
        'content',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}

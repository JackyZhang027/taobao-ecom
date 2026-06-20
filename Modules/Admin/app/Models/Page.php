<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends Model
{
    protected $fillable = [
        'slug',
        'footer_section',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(PageTranslation::class);
    }

    public function getTitleAttribute(): string
    {
        $locale = app()->getLocale();
        $translation = $this->translations->firstWhere('locale', $locale)
            ?? $this->translations->firstWhere('locale', 'en');

        return $translation?->title ?? $this->slug;
    }

    public function getContentAttribute(): ?string
    {
        $locale = app()->getLocale();
        $translation = $this->translations->firstWhere('locale', $locale)
            ?? $this->translations->firstWhere('locale', 'en');

        return $translation?->content;
    }
}

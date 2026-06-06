import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Account } from '@/types';

interface AccountSelectProps {
    accounts: Pick<Account, 'id' | 'code' | 'name'>[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    includeNone?: boolean;
    className?: string;
}

export function AccountSelect({
    accounts,
    value,
    onValueChange,
    placeholder = 'Select account',
    includeNone = false,
    className,
}: AccountSelectProps) {
    const [open, setOpen] = useState(false);

    const selected = value && value !== 'none'
        ? accounts.find((a) => String(a.id) === value)
        : null;

    const label = selected
        ? `${selected.code} — ${selected.name}`
        : (value === 'none' || (includeNone && !value))
            ? 'None (top-level)'
            : null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('w-full justify-between font-normal', !label && 'text-muted-foreground', className)}
                >
                    <span className="truncate">{label ?? placeholder}</span>
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent style={{ width: 'var(--radix-popover-trigger-width)' }}>
                <Command>
                    <CommandInput placeholder="Search accounts..." />
                    <CommandList>
                        <CommandEmpty>No accounts found.</CommandEmpty>
                        <CommandGroup>
                            {includeNone && (
                                <CommandItem
                                    value="none"
                                    onSelect={() => {
                                        onValueChange('');
                                        setOpen(false);
                                    }}
                                >
                                    <CheckIcon className={cn('mr-2 h-4 w-4', !value || value === 'none' ? 'opacity-100' : 'opacity-0')} />
                                    None (top-level)
                                </CommandItem>
                            )}
                            {accounts.map((a) => (
                                <CommandItem
                                    key={a.id}
                                    value={`${a.code} ${a.name}`}
                                    onSelect={() => {
                                        onValueChange(String(a.id));
                                        setOpen(false);
                                    }}
                                >
                                    <CheckIcon className={cn('mr-2 h-4 w-4', String(a.id) === value ? 'opacity-100' : 'opacity-0')} />
                                    <span className="font-mono text-xs text-muted-foreground w-[70px] shrink-0">{a.code}</span>
                                    <span className="truncate">{a.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

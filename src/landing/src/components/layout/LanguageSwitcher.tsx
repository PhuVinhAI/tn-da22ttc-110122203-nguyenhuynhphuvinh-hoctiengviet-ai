import * as React from 'react';
import { DropdownMenu } from 'radix-ui';
import { Check, ChevronDown, Globe } from 'lucide-react';

type LanguageEntry = { code: string; label: string };

interface Props {
	current: string;
	currentLabel: string;
	options: LanguageEntry[];
	hrefs: Record<string, string>;
}

export function LanguageSwitcher({ current, currentLabel, options, hrefs }: Props) {
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<button
					type="button"
					className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-transparent text-xs font-mono uppercase tracking-[0.15em] text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
				>
					<Globe className="size-4 text-muted-foreground" />
					<span className="hidden sm:inline">{currentLabel}</span>
					<ChevronDown className="size-3.5 text-muted-foreground" />
				</button>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					align="end"
					sideOffset={6}
					className="z-50 min-w-44 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-2xl border border-border bg-popover p-2 text-popover-foreground duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
				>
					{options.map((opt) => {
						const active = opt.code === current;
						return (
							<DropdownMenu.Item key={opt.code} asChild>
								<a
									href={hrefs[opt.code]}
									hrefLang={opt.code}
									className="group relative flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium outline-hidden select-none transition-colors focus:bg-muted focus:text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground mt-1 first:mt-0 no-underline"
								>
									<span className="flex-1">{opt.label}</span>
									{active && <Check className="size-4 text-primary" />}
								</a>
							</DropdownMenu.Item>
						);
					})}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}

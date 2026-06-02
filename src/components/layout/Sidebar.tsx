import { NavLink } from 'react-router-dom';
import {
  Library,
  Disc3,
  Settings,
  ChevronsRight,
  ChevronsLeft,
} from 'lucide-react';
import { APP_NAME, NAV_ITEMS } from '@/text';
import { cn } from '@/lib/utils';

const icons = {
  '/': Library,
  '/albums': Disc3,
} as const;

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        'glass-sidebar hidden flex-col border-r border-border md:flex md:sticky md:top-0 md:max-h-[calc(100svh-4rem)] overflow-y-auto scrollbar-hidden transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center',
          collapsed ? 'justify-center' : 'gap-2.5 px-6',
        )}
      >
        <img
          src="/favicon.svg"
          alt=""
          className="size-6 shrink-0"
          aria-hidden="true"
        />
        {!collapsed && (
          <span className="accent-gradient-text text-lg font-semibold tracking-tight">
            {APP_NAME}
          </span>
        )}
      </div>

      <nav
        className={cn(
          'flex-1 space-y-1 overflow-y-auto scrollbar-hidden',
          collapsed ? 'px-2 pt-2' : 'px-3 pt-2',
        )}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.path];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors duration-150',
                  collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          );
        })}
      </nav>

      <div
        className={cn(
          'shrink-0',
          collapsed ? 'px-2 pt-2 pb-1' : 'px-3 pt-2 pb-1',
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted',
            collapsed ? 'mx-auto' : 'ml-auto',
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-5" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </button>
      </div>

      <div
        className={cn(
          'shrink-0',
          collapsed ? 'px-2 pt-1 pb-2' : 'px-3 pt-1 pb-2',
        )}
      >
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-lg text-sm font-medium transition-colors duration-150',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
              isActive
                ? 'bg-primary/12 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && 'Settings'}
        </NavLink>
      </div>
    </aside>
  );
}

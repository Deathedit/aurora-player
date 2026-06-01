import { NavLink } from 'react-router-dom';
import { Library, Disc3, Settings } from 'lucide-react';
import { NAV_ITEMS } from '@/text';
import { cn } from '@/lib/utils';

const icons = {
  '/': Library,
  '/albums': Disc3,
  '/settings': Settings,
} as const;

export function TabBar() {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-50 flex h-14 border-t border-border md:hidden">
      {NAV_ITEMS.map((item) => {
        const Icon = icons[item.path];
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="size-5" />
            {item.label}
          </NavLink>
        );
      })}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground',
          )
        }
      >
        <Settings className="size-5" />
        Settings
      </NavLink>
    </nav>
  );
}

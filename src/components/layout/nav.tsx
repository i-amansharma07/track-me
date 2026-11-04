'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './nav.module.css';

function CheckSquareIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
const links = [
  // { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/tasks', label: 'Tasks', icon: CheckSquareIcon },
  // { href: '/analytics', label: 'Analytics', icon: BarChart3Icon },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Main">
      <ul className={styles.list}>
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname?.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`${styles.link} ${active ? styles.active : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                <span className={styles.label}>{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

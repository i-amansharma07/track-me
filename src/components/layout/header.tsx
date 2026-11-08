"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Dropdown } from "@/components/ui/dropdown";
import styles from "./header.module.css";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user;

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/tasks" className={styles.brand} aria-label="Quartz home">
          <Image src="/brand/quartz-mark-on-dark.svg" alt="" width={28} height={28} className={styles.brandMark} priority />
          <span className={styles.brandText}>Quartz</span>
        </Link>
        {user && (
          <nav className={styles.nav} aria-label="Primary">
            <Link href="/tasks" className={`${styles.navLink} ${pathname === "/tasks" ? styles.navActive : ""}`.trim()}>
              Tasks
            </Link>
            <Link
              href="/analytics"
              className={`${styles.navLink} ${pathname === "/analytics" ? styles.navActive : ""}`.trim()}
            >
              Analytics
            </Link>
          </nav>
        )}
      </div>
      <div className={styles.right}>
        {user && (
          <Dropdown
            align="right"
            trigger={
              <div className={styles.userTrigger} aria-label="Open user menu">
                <img
                  src={user.image || ""}
                  alt={user.name || "User"}
                  className={styles.avatar}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className={styles.userName}>{user.name || user.email || "User"}</span>
                <span className={styles.chevron} aria-hidden="true">
                  ▼
                </span>
              </div>
            }
            options={[
              {
                label: "Sign out",
                value: "signout",
                onClick: () => {
                  void signOut({ callbackUrl: "/login" });
                },
              },
            ]}
          />
        )}
      </div>
    </header>
  );
}

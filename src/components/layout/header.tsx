"use client";

import { signOut, useSession } from "next-auth/react";
import { Dropdown } from "@/components/ui/dropdown";
import styles from "./header.module.css";

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className={styles.header}>
      <div className={styles.brand}>Track Me</div>
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

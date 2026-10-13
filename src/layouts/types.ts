import type { ReactNode } from "react";
import type { User } from "../types";

export type LayoutProps = {
  children: ReactNode;
  route: string;
  user: User | null;
  theme: string;
  preview: boolean;
  onTheme: () => void;
  onAuth: () => void;
  onSearch: () => void;
  onUpdates: () => void;
  onProfile: () => void;
  onLogout: () => void;
};

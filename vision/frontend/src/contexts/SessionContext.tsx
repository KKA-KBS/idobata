import React, { createContext, useContext, useEffect, useState } from "react";

export type SessionMe = {
  tenantId: string | null;
  displayName: string | null;
  role: string | null;
  count: number;
};

const SessionContext = createContext<SessionMe | null>(null);

export function useSession() {
  return useContext(SessionContext);
}

export const SessionGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<SessionMe | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/session/me", { credentials: "include" });
        if (response.status === 404) {
          setReady(true);
          return;
        }
        if (!response.ok) {
          setReady(true);
          return;
        }
        const me = (await response.json()) as SessionMe;
        if (!me.tenantId) {
          const returnTo = encodeURIComponent(window.location.href);
          window.location.assign(`/session?return=${returnTo}`);
          return;
        }
        setSession(me);
        setReady(true);
      } catch {
        setReady(true);
      }
    };
    load();
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  );
};

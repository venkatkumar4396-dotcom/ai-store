"use client";

import * as React from "react";
import api from "@/lib/api";

interface DeployedBotsContextValue {
  /** Set of bot IDs the user has deployed (e.g. "bot-2", "bot-travel") */
  deployedBotIds: Set<string>;
  /** Check if a specific bot ID has been deployed */
  isBotDeployed: (botId: string) => boolean;
  /** Whether the initial fetch is still loading */
  isLoading: boolean;
  /** Re-fetch deployed bots (call after a new deploy) */
  refreshDeployedBots: () => Promise<void>;
}

const DeployedBotsContext = React.createContext<DeployedBotsContextValue>({
  deployedBotIds: new Set(),
  isBotDeployed: () => false,
  isLoading: true,
  refreshDeployedBots: async () => {},
});

export function DeployedBotsProvider({ children }: { children: React.ReactNode }) {
  const [deployedBotIds, setDeployedBotIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchDeployedBots = React.useCallback(async () => {
    if (typeof window !== "undefined" && !localStorage.getItem("nexora_logged_in")) {
      setDeployedBotIds(new Set());
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get("/bots/instances/user");
      const instances: any[] = res.data || [];
      const ids = new Set<string>(instances.map((inst: any) => inst.botId));
      setDeployedBotIds(ids);
    } catch (err) {
      // If fetch fails (e.g. not logged in yet), default to empty set
      console.error("Failed to fetch deployed bots:", err);
      setDeployedBotIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDeployedBots();
  }, [fetchDeployedBots]);

  const isBotDeployed = React.useCallback(
    (botId: string) => deployedBotIds.has(botId),
    [deployedBotIds]
  );

  const value = React.useMemo(
    () => ({
      deployedBotIds,
      isBotDeployed,
      isLoading,
      refreshDeployedBots: fetchDeployedBots,
    }),
    [deployedBotIds, isBotDeployed, isLoading, fetchDeployedBots]
  );

  return (
    <DeployedBotsContext.Provider value={value}>
      {children}
    </DeployedBotsContext.Provider>
  );
}

export function useDeployedBots() {
  return React.useContext(DeployedBotsContext);
}

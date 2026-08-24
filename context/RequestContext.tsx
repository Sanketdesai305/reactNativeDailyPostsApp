// context/RequestContext.tsx

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

interface RequestContextType {
  requestCount: number;
  getRequestCount: () => Promise<void>;
}

const RequestContext = createContext<
  RequestContextType | undefined
>(undefined);

export const RequestProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useAuth();

  const [requestCount, setRequestCount] = useState(0);

  const getRequestCount = async () => {
    if (!user) {
      setRequestCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("requests")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (error) {
      console.error(
        "Error getting request count:",
        error
      );
      return;
    }

    setRequestCount(count ?? 0);
  };

  useEffect(() => {
    getRequestCount();
  }, [user]);

  return (
    <RequestContext.Provider
      value={{
        requestCount,
        getRequestCount,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};

export const useRequests = () => {
  const context = useContext(RequestContext);

  if (!context) {
    throw new Error(
      "useRequests must be used inside RequestProvider"
    );
  }

  return context;
};
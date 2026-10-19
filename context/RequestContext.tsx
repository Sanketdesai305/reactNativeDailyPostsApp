// context/RequestContext.tsx

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface RequestContextType {
  requestCount: number;
  getRequestCount: () => Promise<void>;
  unreadMessageCount: number;
  getUnreadMessageCount: () => Promise<void>;
  markMessagesRead: (senderId: string) => Promise<void>;
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
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const getRequestCount = useCallback(async () => {
    if (!user?.id) {
      setRequestCount(0);
      return;
    }

    const { count: requestCount, error: requestError } = await supabase
      .from("requests")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (requestError) {
      console.error(
        "Error getting request count:",
        requestError
      );
      return;
    }

    const { count: notificationCount, error: notificationError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (notificationError) {
      console.error("Error getting notification count:", notificationError);
      return;
    }

    setRequestCount((requestCount ?? 0) + (notificationCount ?? 0));
  }, [user?.id]);

  const getUnreadMessageCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadMessageCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("messages")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Error getting unread message count:", error);
      return;
    }

    setUnreadMessageCount(count ?? 0);
  }, [user?.id]);

  const markMessagesRead = useCallback(
    async (senderId: string) => {
      if (!user?.id) return;

      const { error } = await supabase.rpc("mark_messages_as_read", {
        p_sender_id: senderId,
      });

      if (error) {
        console.error("Error marking messages as read:", error);
        return;
      }

      await getUnreadMessageCount();
    },
    [user?.id, getUnreadMessageCount]
  );

  useEffect(() => {
    void getRequestCount();
  }, [getRequestCount]);

  useEffect(() => {
    if (!user?.id) {
      setUnreadMessageCount(0);
      return;
    }

    setUnreadMessageCount(0);
    void getUnreadMessageCount();

    const messageChannel = supabase
      .channel(`unread-message-count-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          void getUnreadMessageCount();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(messageChannel);
    };
  }, [user?.id, getUnreadMessageCount]);

  return (
    <RequestContext.Provider
      value={{
        requestCount,
        getRequestCount,
        unreadMessageCount,
        getUnreadMessageCount,
        markMessagesRead,
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
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AcceptedRequest, usePosts } from "../hooks/usePosts";

export default function Chat() {
  const { getAcceptedRequests } = usePosts();
  const { user } = useAuth();

  const [acceptedRequests, setAcceptedRequests] = useState<
    AcceptedRequest[]
  >([]);

  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  // Function to load accepted requests
  const loadAcceptedRequests = async () => {
    const data = await getAcceptedRequests();
    setAcceptedRequests(data);
  };

  useEffect(() => {
    if (!user) return;

    let isActive = true;
    let requestChannel: ReturnType<typeof supabase.channel> | null = null;
    const channelName = `chat-requests-${user.id}`;

    const subscribeToRequests = async () => {
      const existingChannel = supabase
        .getChannels()
        .find((channel) => channel.topic === `realtime:${channelName}`);

      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      if (!isActive) return;

      requestChannel = supabase.channel(channelName);
      requestChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        () => {
          if (isActive) {
            loadAcceptedRequests();
          }
        }
      );
      requestChannel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as {
            sender_id: string;
            receiver_id: string;
          };

          if (
            isActive &&
            (newMessage.sender_id === user.id ||
              newMessage.receiver_id === user.id)
          ) {
            loadAcceptedRequests();
          }
        }
      );

      await requestChannel.subscribe();
    };

    loadAcceptedRequests();
    subscribeToRequests();

    return () => {
      isActive = false;
      if (requestChannel) {
        supabase.removeChannel(requestChannel);
      }
    };
  }, [user?.id]);

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await loadAcceptedRequests();
    } catch (error) {
      console.error("Error refreshing accepted requests:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Chat</Text>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {acceptedRequests.map((request) => (
          <TouchableOpacity
            key={request.id}
            style={styles.userCard}
            onPress={() => {
              if (!request.otherUser?.id) return;

              router.push({
                pathname: "/chat/[userId]",
                params: {
                  userId: request.otherUser.id,
                  ...(request.post_id
                    ? { postId: request.post_id }
                    : {}),
                },
              });
            }}
          >
            {request.otherUser?.profile_image_url ? (
              <Image
                source={{ uri: request.otherUser.profile_image_url }}
                style={styles.profileImage}
              />
            ) : (
              <View
                style={[
                  styles.profileImage,
                  styles.avatarPlaceholder,
                ]}
              >
                <Text style={styles.avatarText}>
                  {request.otherUser?.name?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}

            <Text style={styles.userName}>
              {request.otherUser?.name || "User"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },

  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddd",
  },

  avatarText: {
    color: "#555",
    fontSize: 22,
    fontWeight: "600",
  },

  userName: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: "600",
  },
});
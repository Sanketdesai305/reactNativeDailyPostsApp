import { useAuth } from "@/context/AuthContext";
import { useRequests } from "@/context/RequestContext";
import { supabase } from "@/lib/supabase/client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ReceivedRequest,
  usePosts,
} from "./hooks/usePosts";

interface PostUpdateNotification {
  id: string;
  title: string;
  message: string;
  post_id: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const router = useRouter();
  const { user } = useAuth();
  const { getReceivedRequests, rejectRequest, acceptRequest } = usePosts();
  const { getRequestCount } = useRequests();
  const [requests, setRequests] = useState<ReceivedRequest[]>([]);
  const [postNotifications, setPostNotifications] = useState<PostUpdateNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<PostUpdateNotification | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      const data = await getReceivedRequests();
      setRequests(data);

      const { data: notificationData, error } = await supabase
        .from("notifications")
        .select("id, title, message, post_id, is_read, created_at")
        .eq("recipient_id", user?.id)
        .eq("type", "post_updated")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading post notifications:", error);
      } else {
        setPostNotifications(notificationData ?? []);
      }
    };

    loadRequests();
  }, [user?.id]);

  const handleNotificationPress = async (notification: PostUpdateNotification) => {
    setSelectedNotification(notification);

    if (!notification.is_read) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id)
        .eq("recipient_id", user?.id);

      if (!error) {
        setPostNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        );
        await getRequestCount();
      }
    }
  };

  const handleReject = async (requestId: string) => {
    const success = await rejectRequest(requestId);

    if (success) {
      setRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request.id !== requestId
        ),
      );

      await getRequestCount();
    }
  };

  const handleAccept = async (requestId: string) => {
    const success = await acceptRequest(requestId);

    if (success) {
      setRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request.id !== requestId
        ),
      );

      await getRequestCount();
      router.replace("/(tabs)/chat");
    } else {
      Alert.alert(
        "Unable to assign worker",
        "The request could not be accepted. Make sure the job payment is on hold, then try again."
      );
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={28}
            color="#333"
          />
        </TouchableOpacity>

        <Text style={styles.title}>Notifications</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {postNotifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[styles.notificationCard, !notification.is_read && styles.unreadCard]}
            onPress={() => handleNotificationPress(notification)}
          >
            <Ionicons name="create-outline" size={24} color="#6C63FF" />
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationPreview} numberOfLines={2}>
                {notification.message}
              </Text>
            </View>
            {!notification.is_read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
        {requests.map((request) => (
          <View key={request.id} style={styles.requestCard}>

            {/* CLICKABLE SENDER PROFILE */}
            <TouchableOpacity
              style={styles.profileSection}
              onPress={() =>
                router.push({
                  pathname: "/details",
                  params: {
                    userId: request.sender?.id,
                  },
                })
              }
            >
              {request.sender?.profile_image_url ? (
                <Image
                  source={{
                    uri: request.sender.profile_image_url,
                  }}
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
                    {request.sender?.name?.[0]?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}

              <Text style={styles.senderName}>
                {request.sender?.name}
              </Text>
            </TouchableOpacity>

            {/* BUTTONS */}
            <View style={styles.requestInfo}>

              <Text style={styles.jobTitle}>
                {request.post?.title || "Job"}
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAccept(request.id)}
                >
                  <Text style={styles.acceptText}>
                    Accept
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleReject(request.id)}
                >
                  <Text style={styles.rejectText}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>

            </View>

          </View>
        ))}
      </ScrollView>

      <Modal
        visible={!!selectedNotification}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.notificationModal}>
            <Text style={styles.modalTitle}>
              {selectedNotification?.title}
            </Text>
            <Text style={styles.modalMessage}>
              {selectedNotification?.message}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedNotification(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 25,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 15,
  },

  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,

    // optional shadow
    elevation: 2,
  },

  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 10,
    padding: 16,
    backgroundColor: "#f7f6ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e2ff",
  },
  unreadCard: {
    borderColor: "#6C63FF",
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  notificationPreview: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#6C63FF",
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  notificationModal: {
    width: "100%",
    maxWidth: 380,
    padding: 22,
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 12,
    color: "#222",
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },
  closeButton: {
    alignSelf: "flex-end",
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#6C63FF",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  requestInfo: {
    flex: 1,
    marginLeft: 15,
  },

  senderName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  acceptButton: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
  },

  acceptText: {
    color: "#fff",
    fontWeight: "600",
  },

  rejectButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
  },

  rejectText: {
    color: "#333",
    fontWeight: "600",
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#555",
  },
});
import { useRequests } from "@/context/RequestContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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

export default function Notifications() {
  const router = useRouter();
  const { getReceivedRequests, rejectRequest, acceptRequest } = usePosts();
  const { getRequestCount } = useRequests();
  const [requests, setRequests] = useState<ReceivedRequest[]>([]);

  useEffect(() => {
    const loadRequests = async () => {
      const data = await getReceivedRequests();
      setRequests(data);
    };

    loadRequests();
  }, []);

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
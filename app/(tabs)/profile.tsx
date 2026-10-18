import { useAuth } from "@/context/AuthContext";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { user, updateUser, signOut, refreshUser, deleteAccount } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setRefreshing(false);
    }
  };
  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
  if (!user) return;

  setIsDeleting(true);

  try {
    await deleteAccount(deleteReason);

    setShowDeleteAccount(false);
    setDeleteReason("");

    Alert.alert(
      "Account Deleted",
      "Your account has been successfully deleted.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/(auth)/login"),
        },
      ],
    );
  } catch (error) {
    console.error("Error deleting account:", error);

    Alert.alert(
      "Error",
      "Failed to delete your account. Please try again.",
    );
  } finally {
    setIsDeleting(false);
  }
};

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.profileSection}>
          <Link href="../details" asChild>
            <TouchableOpacity
              // onPress={handleUpdateProfileImage}
              disabled={isUpdating}
            >
              <View>
                {user?.profileImage ? (
                  <Image
                    source={{ uri: user.profileImage }}
                    style={styles.profileImage}
                    cachePolicy={"none"}
                  />
                ) : (
                  <View
                    style={[styles.profileImage, styles.profileImagePlaceholder]}
                  >
                    <Text style={styles.profileImageText}>
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
                {/* 
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>Edit</Text>
              </View> */}
              </View>
            </TouchableOpacity>
          </Link>
          <Text style={styles.name}>{user?.name || "No Name"}</Text>
          <Text style={styles.username}>@{user?.username || "user"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push("/onboarding")}>
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <Text style={styles.settingValue}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push("/notifications")}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push("../paymentSetup")}>
            <Text style={styles.settingLabel}>Payment Setup</Text>
            <Text style={styles.settingValue}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.settingItem}  onPress={() => router.push("/help-support")}>
            <Text style={styles.settingLabel}>Help & Support</Text>
            <Text style={styles.settingValue}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingValue}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}  onPress={() => router.push("/privacy-policy")}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingValue}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.settingItem, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
  style={[styles.settingItem, styles.deleteButton]}
  onPress={() => setShowDeleteAccount(true)}
>
  <Text style={styles.deleteText}>Delete Account</Text>
</TouchableOpacity>
{showDeleteAccount && (
  <View style={styles.deleteAccountContainer}>
    <Text style={styles.deleteAccountTitle}>
      Delete your account?
    </Text>

    <Text style={styles.deleteAccountDescription}>
      This action cannot be undone. If you'd like, tell us why you're
      leaving.
    </Text>

    <TextInput
      style={styles.deleteReasonInput}
      placeholder="Reason (optional)"
      placeholderTextColor="#999"
      value={deleteReason}
      onChangeText={setDeleteReason}
      multiline
      maxLength={250}
    />

    <TouchableOpacity
      style={styles.confirmDeleteButton}
      onPress={handleDeleteAccount}
      disabled={isDeleting}
    >
      <Text style={styles.confirmDeleteText}>
        {isDeleting ? "Deleting..." : "Confirm Delete Account"}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cancelDeleteButton}
      onPress={() => {
        setShowDeleteAccount(false);
        setDeleteReason("");
      }}
      disabled={isDeleting}
    >
      <Text style={styles.cancelDeleteText}>
        Cancel
      </Text>
    </TouchableOpacity>
  </View>
)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 32,
    paddingBottom: 80,
    flexGrow: 1,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    fontSize: 40,
    fontWeight: "600",
    color: "#666",
  },
  editBadge: {
    position: "absolute",
    bottom: 10,
    left: "50%",
    transform: [{ translateX: -22 }],
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#000",
  },
  username: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#999",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 18,
    color: "#999",
  },
  settingValue: {
    fontSize: 18,
    color: "#999",
  },
  signOutButton: {
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
  },
  signOutText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ff3b30",
  },
  deleteText: {
    fontSize: 16,
    color: "#ff3b30",
    fontWeight: "500",
  },
  deleteAccountContainer: {
  marginTop: 10,
  padding: 16,
  backgroundColor: "#fff5f5",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#ffcccc",
},

deleteAccountTitle: {
  fontSize: 18,
  fontWeight: "600",
  color: "#000",
  marginBottom: 8,
},

deleteAccountDescription: {
  fontSize: 14,
  color: "#666",
  lineHeight: 20,
  marginBottom: 12,
},

deleteReasonInput: {
  minHeight: 80,
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  backgroundColor: "#fff",
  padding: 12,
  fontSize: 15,
  color: "#000",
  textAlignVertical: "top",
  marginBottom: 12,
},

confirmDeleteButton: {
  backgroundColor: "#ff3b30",
  paddingVertical: 13,
  borderRadius: 10,
  alignItems: "center",
  marginBottom: 8,
},

confirmDeleteText: {
  color: "#fff",
  fontSize: 15,
  fontWeight: "600",
},

cancelDeleteButton: {
  paddingVertical: 12,
  alignItems: "center",
},

cancelDeleteText: {
  color: "#666",
  fontSize: 15,
  fontWeight: "500",
},
});
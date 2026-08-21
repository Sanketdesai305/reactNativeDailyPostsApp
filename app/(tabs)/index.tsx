import { useAuth } from "@/context/AuthContext";
import { formatTimeAgo, formatTimeRemaining } from "@/lib/date-helper";
import { supabase } from "@/lib/supabase/client";
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Post, usePosts } from "../hooks/usePosts";
interface PostCardProps {
  post: Post;
  currentUserId?: string;
  requestCount: number;
  sendRequest: (receiverId: string, postId: string) => Promise<boolean>;
}

const PostCard = ({ post, currentUserId,requestCount,sendRequest }: PostCardProps) => {
  const [requestSent, setRequestSent] = useState(false);
  const postUser = post.profiles;
  const isOwnPost = post.user_id === currentUserId;
  const router = useRouter();

    useEffect(() => {
    const checkRequestStatus = async () => {
      if (!currentUserId || isOwnPost) {
        return;
      }

      const { data, error } = await supabase
        .from("requests")
        .select("id")
        .eq("post_id", post.id)
        .eq("sender_id", currentUserId)
        .eq("status","pending")
        .maybeSingle();

      if (error) {
        console.error("Error checking request:", error);
        return;
      }

      setRequestSent(!!data);
    };

    checkRequestStatus();
  }, [currentUserId, post.id, isOwnPost]);
  
 const sendRequestFunc = async () => {
    const success = await sendRequest(post.user_id, post.id);

    if (success) {
      setRequestSent(true);
    }
  };
  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>

          <TouchableOpacity
           onPress={() =>
            router.push({
              pathname: "/details",
              params: {
                userId: post.user_id,
              },
            })
          }
          >
          <View style={styles.userInfo}>
            {postUser?.profile_image_url ? (
              <Image
                cachePolicy={"none"}
                source={{ uri: postUser.profile_image_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {postUser?.name?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}

            <View>
              <Text style={styles.username}>
                {isOwnPost ? "You" : `@${postUser?.username}`}
              </Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(post.created_at)}</Text>
            </View>
          </View>
          </TouchableOpacity>
        {/* Post content */}
        <View style={styles.timeRemainingBadge}>
                    {isOwnPost && (
            <TouchableOpacity style={styles.bell}
            onPress={() => router.push("/notifications")}>
              <Ionicons
                name="notifications"
                size={28}
                style={styles.bellIcon}
              />

               {requestCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                     {requestCount > 99 ? "99+" : requestCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <Text style={styles.timeRemainingText}>
            {formatTimeRemaining(post.expires_at)}
          </Text>
        </View>
      </View>

      <Image
        cachePolicy={"none"}
        source={{ uri: post.image_url }}
        style={styles.postImage}
        contentFit="cover"
      />

      <View style={styles.postFooter}>
        {post.description && (
          <Text style={styles.postDescription}>{post.description}</Text>
        )}
        <Text style={styles.postInfo}>
          {isOwnPost ? "Your Post" : `${postUser?.name}' post`} • Expires in{" "}
          {formatTimeRemaining(post.expires_at)}
        </Text>
        {!isOwnPost && <TouchableOpacity onPress={sendRequestFunc} style={styles.SendRequestButton}>
          <Text style={styles.SendRequestText}>
             {requestSent ? "Sent" : "Send Request"}
          </Text>
        </TouchableOpacity>}
      </View>
    </View>
  );
};

export default function Index() {
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  // const { createPost, posts, refreshPosts } = usePosts();
  const {
  createPost,
  posts,
  refreshPosts,
  sendRequest,
  requestCount,
} = usePosts();
  const { user } = useAuth();

    const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused && user) {
      refreshPosts();
    }
  }, [isFocused, user]);
  // Check if user has an active post
  const userActivePost = posts.find(
    (post) =>
      post.user_id === user?.id &&
      post.is_active &&
      new Date(post.expires_at) > new Date(),
  );

  const hasActivePost = !!userActivePost;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPosts();
    } catch (error) {
      console.error("Error refreshing posts:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need camera roll permissions to select a profile image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPreviewImage(result.assets[0].uri);
      setShowPreview(true);
      setDescription("");
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need camera permissions to take a photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPreviewImage(result.assets[0].uri);
      setShowPreview(true);
      setDescription("");
    }
  };

  const showImagePicker = () => {
    Alert.alert("Select Profile Image", "Choose an option", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePost = async () => {
    if (!previewImage) return;

    setIsUploading(true);
    try {
      await createPost(previewImage, description);
      setPreviewImage(null);
      setDescription("");
      setShowPreview(false);
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

 const renderPost = ({ item }: { item: Post }) => (
  <PostCard
    post={item}
    currentUserId={user?.id}
    requestCount={requestCount}
    sendRequest={sendRequest}
  />
);

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "top"]}>
      {/* LIST */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          posts.length === 0 ? styles.emptyContent : styles.content
        }
        ListEmptyComponent={<Text>No posts found</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={showImagePicker}>
        <Text style={styles.fabText}>{hasActivePost ? "♻" : "+"}</Text>
      </TouchableOpacity>

      <Modal visible={showPreview} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {" "}
              {hasActivePost ? "Replace Your Post" : "Preview Your Post"}
            </Text>
            {previewImage && (
              <Image
                cachePolicy={"none"}
                source={{ uri: previewImage }}
                style={styles.previewImage}
                contentFit="cover"
              />
            )}
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add a description (optional)"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPreview(false);
                  setPreviewImage(null);
                  setDescription("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.postButton]}
                onPress={handlePost}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size={24} color="#fff" />
                ) : (
                  <Text style={styles.postButtonText}>
                    {hasActivePost ? "Replace" : "Post"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    bottom: 104,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  previewImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  descriptionInput: {
    width: "100%",
    minHeight: 80,
    maxHeight: 120,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#000",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  postButton: {
    backgroundColor: "#000",
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  content: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  postContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  timeAgo: {
    fontSize: 12,
    color: "#666",
  },
    bell:{
    position:"relative",
    color:"#fff",
    padding:1,
    marginLeft:40,
    alignItems: "center",
    justifyContent: "center",
  },
  bellIcon:{
    color:"#333"
  },
  notificationBadge:{
  position: "absolute",
  top: -2,
  right: -2,
  backgroundColor: "red",
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 4,
  },
  notificationBadgeText:{
     color: "white",
  fontSize: 11,
  fontWeight: "bold",
  },
  timeRemainingBadge: {
    backgroundColor: "#fff",
  },
    timeRemainingText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
  },
  SendRequestButton:{
    display:"flex",
    backgroundColor:"#000",
    borderRadius:12,
    padding:10,
    marginTop:5
  },
  SendRequestText:{
    color:"#fff",
    textAlign:"center"
  },
  postImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f5f5f5",
  },
  postFooter: {
    padding: 16,
  },
  postDescription: {
    fontSize: 15,
    color: "#000",
    marginBottom: 8,
    lineHeight: 20,
  },
  postInfo: {
    fontSize: 14,
    color: "#666",
  },
});
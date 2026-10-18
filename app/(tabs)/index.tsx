import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";
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
  RefreshControl, ScrollView, Share, StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { SafeAreaView } from "react-native-safe-area-context";
import { Post, usePosts } from "../hooks/usePosts";
interface PostCardProps {
  post: Post;
  currentUserId?: string;
  sendRequest: (receiverId: string, postId: string) => Promise<boolean>;
  onPress?: () => void;
}

const PostCard = ({ post, currentUserId, sendRequest, onPress }: PostCardProps) => {
  const [requestStatus, setRequestStatus] = useState<
    "none" | "pending" | "accepted" | "rejected"
  >("none");
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
        .select("status")
        .eq("post_id", post.id)
        .eq("sender_id", currentUserId)
        .in("status", ["pending", "accepted", "rejected"])
        .maybeSingle();

      if (error) {
        console.error("Error checking request:", error);
        return;
      }

      setRequestStatus(data?.status ?? "none");
    };

    checkRequestStatus();
  }, [currentUserId, post.id, isOwnPost]);

  const sendRequestFunc = async () => {
    const success = await sendRequest(post.user_id, post.id);

    if (success) {
      setRequestStatus("pending");
    }
  };
  const handleShareJob = async (post: Post) => {
    try {
      const jobUrl = `https://kelsa.app/job/${post.id}`;

      await Share.share({
        message: `🔧 ${post.description}\n\n💰 ₹${post.budget}\n\nView and apply:\n${jobUrl}`,
      });
    } catch (error) {
      console.error("Error sharing job:", error);
    }
  };
  return (
    <TouchableOpacity
      activeOpacity={0.96}
      onPress={onPress}
      style={styles.postContainer}
    >
      <View style={styles.postHeader}>

        <TouchableOpacity
          onPress={(event) => {
            event.stopPropagation();
            router.push({
              pathname: "/details",
              params: {
                userId: post.user_id,
              },
            });
          }}
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
          <Text style={styles.timeRemainingText}>
            {formatTimeRemaining(post.expires_at)}
          </Text>
        </View>
      </View>

      {post.image_url ? (
        <Image
          cachePolicy="none"
          source={{ uri: post.image_url }}
          style={styles.postImage}
          contentFit="cover"
        />
      ) : (
        <View style={styles.noImageContainer}>
          <Ionicons
            name="briefcase-outline"
            size={40}
            color="#aaa"
          />
        </View>
      )}

      <View style={styles.postFooter}>

        {/* JOB TITLE */}
        <View style={styles.share}>
          <Text style={styles.jobTitle} >
            {post.title}
          </Text>

          <TouchableOpacity
            onPress={(event) => {
              event.stopPropagation();
              handleShareJob(post);
            }}
          >
            <Ionicons name="share-social-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* DESCRIPTION */}
        {post.description && (
          <Text style={styles.postDescription}>
            {post.description}
          </Text>
        )}

        {/* JOB DETAILS */}
        <View style={styles.jobDetails}>

          {/* TASK TYPE */}
          <View style={styles.detailItem}>
            <Ionicons
              name={
                post.task_type === "multiple"
                  ? "list"
                  : "checkmark-circle-outline"
              }
              size={18}
              color="#6C63FF"
            />

            <Text style={styles.detailText}>
              {post.task_type === "multiple"
                ? "Multiple tasks"
                : "Single task"}
            </Text>
          </View>

          {/* BUDGET */}
          {post.budget !== null &&
            post.budget !== undefined && (
              <View style={styles.detailItem}>
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color="#6C63FF"
                />

                <Text style={styles.detailText}>
                  ₹{post.budget.toLocaleString("en-IN")}
                </Text>

                {post.is_negotiable && (
                  <Text style={styles.negotiable}>
                    Negotiable
                  </Text>
                )}
              </View>
            )}

          {/* DURATION */}
          {post.duration_hours !== null &&
            post.duration_hours !== undefined && (
              <View style={styles.detailItem}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color="#6C63FF"
                />

                <Text style={styles.detailText}>
                  {post.duration_hours}{" "}
                  {post.duration_hours === 1
                    ? "hour"
                    : "hours"}
                </Text>
              </View>
            )}

          {/* LOCATION */}
          {post.location && (
            <View style={styles.detailItem}>
              <Ionicons
                name="location-outline"
                size={18}
                color="#6C63FF"
              />

              <Text style={styles.detailText}>
                {post.location}
              </Text>
            </View>
          )}

        </View>

        {/* REQUIREMENTS */}
        {post.requirements && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>
              Requirements
            </Text>

            <Text style={styles.requirementsText}>
              {post.requirements}
            </Text>
          </View>
        )}

        {/* POST INFO */}
        <Text style={styles.postInfo}>
          {isOwnPost
            ? "Your Post"
            : `${postUser?.name}' post`}
          {" • "}
          Expires in{" "}
          {formatTimeRemaining(post.expires_at)}
        </Text>

        {/* SEND REQUEST */}
        {!isOwnPost && (
          <TouchableOpacity
            onPress={(event) => {
              event.stopPropagation();
              sendRequestFunc();
            }}
            disabled={
              requestStatus === "pending" ||
              requestStatus === "accepted"
            }
            style={styles.SendRequestButton}
          >
            <Text style={styles.SendRequestText}>
              {requestStatus === "pending" || requestStatus === "accepted"
                ? "Sent"
                : "Send Request"}
            </Text>
          </TouchableOpacity>
        )}

      </View>

    </TouchableOpacity>
  );
};

export default function Index() {
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<"single" | "multiple">("single");
  const [budget, setBudget] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [durationHours, setDurationHours] = useState("");
  const [requirements, setRequirements] = useState("");
  const [location, setLocation] = useState("");
  const router = useRouter();
  // const { createPost, posts, refreshPosts } = usePosts();
  const {
    createPost,
    updatePost,
    posts,
    refreshPosts,
    sendRequest,
    createPaymentOrder,
  } = usePosts();
  const { user } = useAuth();
  const {
    searchQuery
  } = useSearch();
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

  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      post.title?.toLowerCase().includes(query) ||
      post.description?.toLowerCase().includes(query) ||
      post.requirements?.toLowerCase().includes(query) ||
      post.location?.toLowerCase().includes(query)
    );
  });
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
    if (!title.trim()) {
      Alert.alert(
        "Missing title",
        "Please enter a job title."
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        "Missing description",
        "Please describe the job."
      );
      return;
    }

    if (!budget.trim()) {
      Alert.alert(
        "Missing budget",
        "Please enter a budget."
      );
      return;
    }

    const budgetNumber = Number(budget);

    if (isNaN(budgetNumber) || budgetNumber <= 0) {
      Alert.alert(
        "Invalid budget",
        "Please enter a valid budget."
      );
      return;
    }

    const durationNumber = durationHours.trim()
      ? Number(durationHours)
      : undefined;

    if (
      durationNumber !== undefined &&
      (isNaN(durationNumber) || durationNumber <= 0)
    ) {
      Alert.alert(
        "Invalid duration",
        "Please enter a valid number of hours."
      );
      return;
    }

    setIsUploading(true);

    try {
      if (hasActivePost && userActivePost) {
        await updatePost({
          postId: userActivePost.id,
          imageUri: previewImage ?? undefined,
          title: title.trim(),
          description: description.trim(),
          taskType,
          isNegotiable,
          durationHours: durationNumber,
          requirements: requirements.trim() || undefined,
          location: location.trim() || undefined,
        });

        await refreshPosts();
        setShowPreview(false);
        return;
      }

      // ------------------------------------------
      // 1. CREATE RAZORPAY ORDER
      // ------------------------------------------

      const payment = await createPaymentOrder(
        budgetNumber
      );

      // ------------------------------------------
      // 2. OPEN RAZORPAY CHECKOUT
      // ------------------------------------------

      const razorpayResult =
        await RazorpayCheckout.open({
          key: payment.keyId,

          amount: payment.amount,

          currency: payment.currency,

          name: "Kelsa",

          description: title.trim(),

          order_id: payment.orderId,

          theme: {
            color: "#6C63FF",
          },
        });



      // ------------------------------------------
      // 4. PAYMENT SUCCESSFUL
      // ------------------------------------------
      const newPost = await createPost({
        imageUri: previewImage ?? undefined,
        title: title.trim(),
        description: description.trim(),
        taskType,
        budget: budgetNumber,
        isNegotiable,
        durationHours: durationNumber,
        requirements: requirements.trim() || undefined,
        location: location.trim() || undefined,
      });
      console.log("NEW POST CREATED:", newPost);
      const { data: paymentData, error: paymentError } =
        await supabase.functions.invoke("complete-payment", {
          body: {
            postId: newPost.id,
            amount: budgetNumber,
            platformFee: payment.platformFee,
            workerAmount: payment.workerAmount,
            razorpayOrderId:
              razorpayResult.razorpay_order_id,
            razorpayPaymentId:
              razorpayResult.razorpay_payment_id,
          },
        });

      if (paymentError || !paymentData?.success) {
        console.error("Complete payment error:", {
          paymentError,
          paymentData,
        });

        throw new Error(
          paymentError?.message ||
          paymentData?.error ||
          "Failed to record payment"
        );
      }

      await refreshPosts();

      setPreviewImage(null);
      setTitle("");
      setDescription("");
      setTaskType("single");
      setBudget("");
      setIsNegotiable(true);
      setDurationHours("");
      setRequirements("");
      setLocation("");
      setShowPreview(false);

    } catch (error: any) {
      console.error("Error creating post:", error);

      Alert.alert(
        "Error",
        error?.message ||
        "Failed to create post. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.id}
      sendRequest={sendRequest}
      onPress={() =>
        router.push({
          pathname: "/jobDetails",
          params: {
            postId: item.id,
          },
        })
      }
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "top"]}>
      {/* LIST */}
      <FlatList
        data={filteredPosts}
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (hasActivePost && userActivePost) {
            setTitle(userActivePost.title);
            setDescription(userActivePost.description ?? "");
            setTaskType(userActivePost.task_type);
            setBudget(String(userActivePost.budget ?? ""));
            setIsNegotiable(userActivePost.is_negotiable);
            setDurationHours(String(userActivePost.duration_hours ?? ""));
            setRequirements(userActivePost.requirements ?? "");
            setLocation(userActivePost.location ?? "");
            setPreviewImage(userActivePost.image_url ?? null);
          }
          setShowPreview(true);
        }}
      >
        <Ionicons
          name={hasActivePost ? "pencil" : "add"}
          size={26}
          color="#fff"
        />
      </TouchableOpacity>

      <Modal
        visible={showPreview}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >

            <Text style={styles.modalTitle}>
              {hasActivePost ? "Edit Your Job" : "Post a Job"}
            </Text>

            {/* JOB TITLE */}
            <TextInput
              style={styles.formInput}
              placeholder="Job title"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            {/* DESCRIPTION */}
            <TextInput
              style={[
                styles.formInput,
                styles.descriptionInput,
              ]}
              placeholder={`Need a quick local delivery...
        Need someone to take my dog for a walk...
        Need someone to help me clean my garage`}


              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />

            {/* TASK TYPE */}

            <View style={styles.taskTypeContainer}>

              <TouchableOpacity
                style={[
                  styles.taskTypeButton,
                  taskType === "single" &&
                  styles.taskTypeButtonActive,
                ]}
                onPress={() => setTaskType("single")}
              >
                <Text
                  style={[
                    styles.taskTypeText,
                    taskType === "single" &&
                    styles.taskTypeTextActive,
                  ]}
                >
                  Single task
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.taskTypeButton,
                  taskType === "multiple" &&
                  styles.taskTypeButtonActive,
                ]}
                onPress={() => setTaskType("multiple")}
              >
                <Text
                  style={[
                    styles.taskTypeText,
                    taskType === "multiple" &&
                    styles.taskTypeTextActive,
                  ]}
                >
                  Multiple tasks
                </Text>
              </TouchableOpacity>

            </View>

            {/* BUDGET */}
            <TextInput
              style={styles.formInput}
              placeholder="Budget (₹)"
              placeholderTextColor="#999"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              editable={!hasActivePost}
            />

            {/* NEGOTIABLE */}
            <TouchableOpacity
              style={styles.negotiableRow}
              onPress={() =>
                setIsNegotiable(!isNegotiable)
              }
            >
              <Ionicons
                name={
                  isNegotiable
                    ? "checkbox"
                    : "square-outline"
                }
                size={24}
                color="#6C63FF"
              />

              <Text style={styles.negotiableLabel}>
                Budget is negotiable
              </Text>
            </TouchableOpacity>

            {/* DURATION */}
            <TextInput
              style={styles.formInput}
              placeholder="Estimated duration (hours)"
              placeholderTextColor="#999"
              value={durationHours}
              onChangeText={setDurationHours}
              keyboardType="decimal-pad"
            />

            {/* REQUIREMENTS */}
            <TextInput
              style={[
                styles.formInput,
                styles.smallTextArea,
              ]}
              placeholder={`Requirements (optional)
        Eg: Must have a 2 wheeler
        Must have equipments`}
              placeholderTextColor="#999"
              value={requirements}
              onChangeText={setRequirements}
              multiline
              textAlignVertical="top"
            />

            {/* LOCATION */}
            <TextInput
              style={styles.formInput}
              placeholder="Location (optional)"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
            />

            {/* PHOTO */}
            {previewImage ? (
              <View>
                <Image
                  cachePolicy="none"
                  source={{
                    uri: previewImage,
                  }}
                  style={styles.previewImage}
                  contentFit="cover"
                />

                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={showImagePicker}
                >
                  <Text style={styles.changePhotoText}>
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={showImagePicker}
              >
                <Ionicons
                  name="image-outline"
                  size={24}
                  color="#6C63FF"
                />

                <Text style={styles.addPhotoText}>
                  Add Photo (Optional)
                </Text>
              </TouchableOpacity>
            )}

            {/* BUTTONS */}
            <View style={styles.modalButtons}>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}
                onPress={() => {
                  setShowPreview(false);
                  setPreviewImage(null);
                  setTitle("");
                  setDescription("");
                  setTaskType("single");
                  setBudget("");
                  setIsNegotiable(true);
                  setDurationHours("");
                  setRequirements("");
                  setLocation("");
                }}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.postButton,
                ]}
                onPress={handlePost}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator
                    size={24}
                    color="#fff"
                  />
                ) : (
                  <Text style={styles.postButtonText}>
                    {hasActivePost ? "Save Changes" : "Post Job"}
                  </Text>
                )}
              </TouchableOpacity>

            </View>

          </ScrollView>
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
  share: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f8fa",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    color: "#222",
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  taskTypeContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  taskTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  taskTypeButtonActive: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  taskTypeText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },

  taskTypeTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  negotiableRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  negotiableLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },

  smallTextArea: {
    minHeight: 70,
  },

  addPhotoButton: {
    height: 90,
    borderWidth: 1.5,
    borderColor: "#d8d8e0",
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafaff",
    marginBottom: 14,
  },

  addPhotoText: {
    marginTop: 7,
    fontSize: 14,
    fontWeight: "600",
    color: "#6C63FF",
  },

  changePhotoButton: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#f0efff",
  },

  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C63FF",
  },

  noImageContainer: {
    height: 180,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 20
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  postButton: {
    backgroundColor: "#000",
    marginBottom: 20
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
  bell: {
    position: "relative",
    color: "#fff",
    padding: 1,
    marginLeft: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bellIcon: {
    color: "#333"
  },
  notificationBadge: {
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
  notificationBadgeText: {
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
  SendRequestButton: {
    display: "flex",
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 10,
    marginTop: 5
  },
  SendRequestText: {
    color: "#fff",
    textAlign: "center"
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
  jobTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },

  jobDetails: {
    gap: 9,
    marginBottom: 14,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailText: {
    marginLeft: 7,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  negotiable: {
    marginLeft: 8,
    color: "#6C63FF",
    fontSize: 13,
    fontWeight: "600",
  },

  requirementsContainer: {
    marginTop: 4,
    marginBottom: 14,
    padding: 12,
    backgroundColor: "#f7f7f9",
    borderRadius: 10,
  },

  requirementsTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 5,
  },

  requirementsText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
});
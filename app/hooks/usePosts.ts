import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { uploadPostImage } from "@/lib/supabase/storage";
import { useEffect, useState } from "react";

export interface PostUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}
interface CreatePostData {
  imageUri?: string;
  title: string;
  description: string;
  taskType: "single" | "multiple";
  budget: number;
  isNegotiable: boolean;
  durationHours?: number;
  requirements?: string;
  location?: string;
}

interface UpdatePostData {
  postId: string;
  imageUri?: string;
  title: string;
  description: string;
  taskType: "single" | "multiple";
  isNegotiable: boolean;
  durationHours?: number;
  requirements?: string;
  location?: string;
}
export interface Post {
  id: string;
  user_id: string;
  task_type: "single" | "multiple";

  budget?: number | null;
  is_negotiable: boolean;

  duration_hours?: number | null;

  requirements?: string | null;
  location?: string | null;
  image_url?: string | null;
  title: string;
  description?: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  profiles?: PostUser;
}

export interface ReceivedRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  post_id: string;
  status: string;
  created_at: string;

  sender?: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  } | null;

  post?: {
    id: string;
    title: string;
  } | null;
}

export interface AcceptedRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  post_id: string;
  status: string;
  created_at: string;

  otherUser: {
    id: string;
    name: string | null;
    username: string | null;
    profile_image_url: string | null;
  } | null;
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);
  const { user } = useAuth();

  // useEffect(() => {
  //   loadPosts();
  // }, []);
  useEffect(() => {
    if (user) {
      loadPosts();
      getRequestCount();
    }
  }, [user]);

  const deleteExpiredPosts = async () => {
    const { error } = await supabase
      .from("posts")
      .delete()
      .lte(
        "expires_at",
        new Date().toISOString()
      );

    if (error) {
      console.error(
        "Error deleting expired posts:",
        error
      );
    }
  };

  const loadPosts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await deleteExpiredPosts();
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
            *,
            profiles(id, name, username, profile_image_url)`,
        )
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error loading posts:", postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      const postsWithProfiles = postsData.map((post) => ({
        ...post,
        profiles: post.profiles || null,
      }));

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error("Error in loadPosts:", error);
    } finally {
      setIsLoading(false);
    }
  };



  const createPost = async ({
    imageUri,
    title,
    description,
    taskType,
    budget,
    isNegotiable,
    durationHours,
    requirements,
    location,
  }: CreatePostData) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      // Deactivate any existing posts
      const { error: deactivateError } = await supabase
        .from("posts")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (deactivateError) {
        console.error("Error deactivating old posts:", deactivateError);
      }

      let imageUrl: string | null = null;

      if (imageUri) {
        imageUrl = await uploadPostImage(
          user.id,
          imageUri
        );
      }

      // Calculate expiration time
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: newPost, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          image_url: imageUrl,

          title: title.trim(),
          description: description.trim(),

          task_type: taskType,

          budget,
          is_negotiable: isNegotiable,

          duration_hours: durationHours ?? null,

          requirements: requirements?.trim() || null,
          location: location?.trim() || null,

          expires_at: expiresAt.toISOString(),
          is_active: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating post:", error);
        throw error;
      }

      // Refresh posts
      await loadPosts();
      return newPost;
    } catch (error) {
      console.error("Error in createPost:", error);
      throw error;
    }
  };

  const refreshPosts = async () => {
    await loadPosts();
    await getRequestCount();
  };

  const updatePost = async ({
    postId,
    imageUri,
    title,
    description,
    taskType,
    isNegotiable,
    durationHours,
    requirements,
    location,
  }: UpdatePostData) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    let imageUrl: string | undefined;

    if (imageUri && !imageUri.startsWith("http")) {
      imageUrl = await uploadPostImage(user.id, imageUri);
    }

    const { data: previousPost, error: previousPostError } = await supabase
      .from("posts")
      .select("title, description, task_type, is_negotiable, duration_hours, requirements, location, image_url")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (previousPostError) {
      throw previousPostError;
    }

    const updatedFields = {
      title: title.trim(),
      description: description.trim(),
      task_type: taskType,
      is_negotiable: isNegotiable,
      duration_hours: durationHours ?? null,
      requirements: requirements?.trim() || null,
      location: location?.trim() || null,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    };

    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update(updatedFields)
      .eq("id", postId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const changes: string[] = [];
    const changed = (label: string, oldValue: unknown, newValue: unknown) => {
      if (String(oldValue ?? "") !== String(newValue ?? "")) {
        changes.push(label);
      }
    };

    changed("Title", previousPost.title, updatedFields.title);
    changed("Description", previousPost.description, updatedFields.description);
    changed("Task type", previousPost.task_type, updatedFields.task_type);
    changed("Negotiable setting", previousPost.is_negotiable, updatedFields.is_negotiable);
    changed("Duration", previousPost.duration_hours, updatedFields.duration_hours);
    changed("Requirements", previousPost.requirements, updatedFields.requirements);
    changed("Location", previousPost.location, updatedFields.location);
    if (imageUrl && imageUrl !== previousPost.image_url) {
      changes.push("Photo");
    }

    if (changes.length > 0) {
      const { data: acceptedRequests, error: requestsError } = await supabase
        .from("requests")
        .select("sender_id, receiver_id")
        .eq("post_id", postId)
        .eq("status", "accepted");

      if (requestsError) {
        throw requestsError;
      }

      const recipientIds = [
        ...new Set(
          (acceptedRequests ?? []).flatMap((request) => [
            request.sender_id,
            request.receiver_id,
          ]).filter((id) => id !== user.id)
        ),
      ];

      if (recipientIds.length > 0) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert(
            recipientIds.map((recipientId) => ({
              recipient_id: recipientId,
              sender_id: user.id,
              post_id: postId,
              type: "post_updated",
              title: "Post updated",
              message: `${title.trim()} changed: ${changes.join(", ")}`,
              is_read: false,
            }))
          );

        if (notificationError) {
          throw notificationError;
        }
      }
    }

    await loadPosts();
    return updatedPost;
  };


  // SEND REQUEST
  const sendRequest = async (
    receiverId: string,
    postId: string
  ) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const { data: existingRequest, error: lookupError } = await supabase
        .from("requests")
        .select("id, status")
        .eq("post_id", postId)
        .eq("sender_id", user.id)
        .in("status", ["pending", "accepted", "rejected"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        console.error("Error checking existing request:", lookupError);
        return false;
      }

      if (existingRequest?.status === "accepted") {
        return false;
      }

      const { error } = existingRequest
        ? await supabase
          .from("requests")
          .update({ status: "pending" })
          .eq("id", existingRequest.id)
        : await supabase
        .from("requests")
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          post_id: postId,
          status: "pending",
        });

      if (error) {
        console.error("Error sending request:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("Error in sendRequest:", error);
      return false;
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const { error } = await supabase
        .from("requests")
        .update({ status: "rejected" })
        .eq("id", requestId)
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (error) {
        console.error("Error rejecting request:", error);
        return false;
      }

      setRequestCount((count) => Math.max(0, count - 1));
      return true;
    } catch (error) {
      console.error("Error in rejectRequest:", error);
      return false;
    }
  };

  const acceptRequest = async (requestId: string) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      // 1. Get the request so we know which post it belongs to
      const { data: request, error: requestError } = await supabase
        .from("requests")
        .select("post_id")
        .eq("id", requestId)
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .single();

      if (requestError || !request) {
        console.error("Error getting request:", requestError);
        return false;
      }

      // 2. Accept the request
      const { error: acceptError } = await supabase
        .from("requests")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (acceptError) {
        console.error("Error accepting request:", acceptError);
        return false;
      }

      // 3. Mark the accepted request as ready for chat
      const { error: postError } = await supabase
        .from("posts")
        .update({
          status: "in_progress",
        })
        .eq("id", request.post_id);

      if (postError) {
        console.error("Error updating post status:", postError);
        return false;
      }

      // 4. Remove the request from notification count
      setRequestCount((count) => Math.max(0, count - 1));

      return true;
    } catch (error) {
      console.error("Error in acceptRequest:", error);
      return false;
    }
  };

  // GET NUMBER OF RECEIVED REQUESTS
  const getRequestCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from("requests")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (error) {
        console.error("Error getting request count:", error);
        return;
      }

      setRequestCount(count ?? 0);
    } catch (error) {
      console.error("Error in getRequestCount:", error);
    }
  };

const getReceivedRequests = async (): Promise<ReceivedRequest[]> => {
  if (!user) return [];

  try {
    // Get pending requests
    const { data: requestsData, error: requestsError } =
      await supabase
        .from("requests")
        .select("*")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (requestsError) {
      console.error("Error getting requests:", requestsError);
      return [];
    }

    if (!requestsData || requestsData.length === 0) {
      return [];
    }

    // Get all sender IDs
    const senderIds = requestsData.map(
      (request) => request.sender_id
    );

    // Get all post IDs
    const postIds = requestsData.map(
      (request) => request.post_id
    );

    // Get sender profiles using the auth UUID stored in profiles.id
    const { data: profilesData, error: profilesError } =
      await supabase
        .from("profiles")
        .select(
          "id, name, username, profile_image_url"
        )
        .in("id", senderIds);

    if (profilesError) {
      console.error(
        "Error getting sender profiles:",
        profilesError
      );
      return [];
    }

    // Get job posts
    const { data: postsData, error: postsError } =
      await supabase
        .from("posts")
        .select("id, title")
        .in("id", postIds);

    if (postsError) {
      console.error(
        "Error getting posts:",
        postsError
      );
      return [];
    }

    // Combine request + sender profile + post
const requestsWithProfiles: ReceivedRequest[] =
  requestsData.map((request) => {
    const profile = profilesData?.find(
      (profile) =>
        profile.id === request.sender_id
    );

    const post = postsData?.find(
      (post) =>
        post.id === request.post_id
    );

    return {
      id: request.id,
      sender_id: request.sender_id,
      receiver_id: request.receiver_id,
      post_id: request.post_id,
      status: request.status,
      created_at: request.created_at,

      sender: profile
        ? {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            profile_image_url:
              profile.profile_image_url,
          }
        : null,

      post: post ?? null,
    };
  });

    return requestsWithProfiles;

  } catch (error) {
    console.error(
      "Error in getReceivedRequests:",
      error
    );

    return [];
  }
};

const getAcceptedRequests = async (): Promise<AcceptedRequest[]> => {
  if (!user) return [];

  try {
    // 1. Get accepted requests involving the current user
    const { data: requestsData, error: requestsError } =
      await supabase
        .from("requests")
        .select(`
          id,
          sender_id,
          receiver_id,
          post_id,
          status,
          created_at
        `)
        .eq("status", "accepted")
        .or(
          `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
        )
        .order("created_at", { ascending: false });

    if (requestsError) {
      console.error(
        "Error getting accepted requests:",
        requestsError
      );
      return [];
    }

    if (!requestsData || requestsData.length === 0) {
      return [];
    }

    // 2. Get the ID of the other user for each request
    const otherUserIds = requestsData.map((request) =>
      request.sender_id === user.id
        ? request.receiver_id
        : request.sender_id
    );

    // Remove duplicates
    const uniqueUserIds = [
      ...new Set(otherUserIds),
    ];

    // 3. Get profiles using the auth UUID stored in profiles.id
    const {
      data: profilesData,
      error: profilesError,
    } = await supabase
      .from("profiles")
      .select(
        "id, name, username, profile_image_url"
      )
      .in("id", uniqueUserIds);

    if (profilesError) {
      console.error(
        "Error getting accepted request profiles:",
        profilesError
      );
      return [];
    }

    // 4. Attach the OTHER user's profile
    const requestsWithProfiles: AcceptedRequest[] =
      requestsData.map((request) => {
        const otherUserId =
          request.sender_id === user.id
            ? request.receiver_id
            : request.sender_id;

        const profile = profilesData?.find(
          (profile) =>
            profile.id === otherUserId
        );

        return {
          id: request.id,
          sender_id: request.sender_id,
          receiver_id: request.receiver_id,
          post_id: request.post_id,
          status: request.status,
          created_at: request.created_at,

          otherUser: profile
            ? {
                id: profile.id,
                name: profile.name,
                username: profile.username,
                profile_image_url:
                  profile.profile_image_url,
              }
            : null,
        };
      });

    return requestsWithProfiles;
  } catch (error) {
    console.error(
      "Error in getAcceptedRequests:",
      error
    );

    return [];
  }
};
  // CREATE RAZORPAY PAYMENT ORDER
  const createPaymentOrder = async (amount: number) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-payment-order",
        {
          body: {
            amount,
          },
        }
      );

      if (error) {
        console.error("Error creating payment order:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.error || "Unable to create payment order"
        );
      }

      return data;
    } catch (error) {
      console.error("Error in createPaymentOrder:", error);
      throw error;
    }
  };

  return {
    createPost,
    updatePost,
    posts,
    refreshPosts,
    sendRequest,
    rejectRequest,
    acceptRequest,
    requestCount,
    getRequestCount,
    getReceivedRequests,
    getAcceptedRequests,
    createPaymentOrder,
  };
};
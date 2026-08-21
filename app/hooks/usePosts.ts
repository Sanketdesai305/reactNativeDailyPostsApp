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

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  description?: string;
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
  sender: PostUser | null;
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
      .or(
        `is_active.eq.false,expires_at.lte.${new Date().toISOString()}`
      );

    if (error) {
      console.error("Error deleting expired posts:", error);
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



  const createPost = async (imageUri: string, description?: string) => {
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

      const imageUrl = await uploadPostImage(user.id, imageUri);

      // Calculate expiration time
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          description: description || null,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating post:", error);
        throw error;
      }

      // Refresh posts
      await loadPosts();
    } catch (error) {
      console.error("Error in createPost:", error);
      throw error;
    }
  };

  const refreshPosts = async () => {
    await loadPosts();
    await getRequestCount();
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
      const { error } = await supabase
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
      const { error } = await supabase
        .from("requests")
        .update({ status: "accepted" })
        .eq("id", requestId)
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (error) {
        console.error("Error accepting request:", error);
        return false;
      }

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
      const { data: requestsData, error: requestsError } = await supabase
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

      // Get their profiles
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

      // Combine request + sender profile
      const requestsWithProfiles: ReceivedRequest[] =
        requestsData.map((request) => ({
          id: request.id,
          sender_id: request.sender_id,
          receiver_id: request.receiver_id,
          post_id: request.post_id,
          status: request.status,
          created_at: request.created_at,

          sender:
            profilesData?.find(
              (profile) =>
                profile.id === request.sender_id
            ) ?? null,
        }));

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
      const { data: requests, error: requestError } = await supabase
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
        );

      if (requestError) {
        console.error(
          "Error getting accepted requests:",
          requestError
        );
        return [];
      }

      if (!requests || requests.length === 0) {
        return [];
      }

      // 2. Determine the other user's ID for each request
      const otherUserIds = requests.map((request) =>
        request.sender_id === user.id
          ? request.receiver_id
          : request.sender_id
      );

      // 3. Get their profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select(`
        id,
        name,
        username,
        profile_image_url
      `)
        .in("id", otherUserIds);

      if (profileError) {
        console.error(
          "Error getting profiles:",
          profileError
        );
        return [];
      }

      // 4. Attach the correct profile to each request
      return requests.map((request) => {
        const otherUserId =
          request.sender_id === user.id
            ? request.receiver_id
            : request.sender_id;

        const otherUser = profiles?.find(
          (profile) => profile.id === otherUserId
        );

        return {
          id: request.id,
          sender_id: request.sender_id,
          receiver_id: request.receiver_id,
          post_id: request.post_id,
          status: request.status,
          created_at: request.created_at,
          otherUser: otherUser ?? null,
        };
      });
    } catch (error) {
      console.error(
        "Error in getAcceptedRequests:",
        error
      );

      return [];
    }
  };

  return {
    createPost,
    posts,
    refreshPosts,
    sendRequest,
    rejectRequest,
    acceptRequest,
    requestCount,
    getRequestCount,
    getReceivedRequests,
    getAcceptedRequests,
  };
};
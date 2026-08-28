import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  post_id: string | null;
  content: string;
  created_at: string;
}
interface ChatUser {
  id: string;
  name: string | null;
  username: string | null;
  profile_image_url: string | null;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { userId, postId } = useLocalSearchParams<{
    userId: string;
    postId: string;
  }>();

  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  // --------------------------------------------------
  // LOAD OTHER USER
  // --------------------------------------------------

  useEffect(() => {
    if (!userId) return;

    const loadOtherUser = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          username,
          profile_image_url
        `)
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading chat user:", error);
        return;
      }

      setOtherUser(data);
    };

    loadOtherUser();
  }, [userId]);

  // --------------------------------------------------
  // LOAD EXISTING MESSAGES
  // --------------------------------------------------

  const loadMessages = async () => {
    if (!user?.id || !userId) return;

    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        sender_id,
        receiver_id,
        post_id,
        content,
        created_at
      `)
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
      )
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data ?? []);
  };

  // --------------------------------------------------
  // INITIAL LOAD + REALTIME
  // --------------------------------------------------

  useEffect(() => {
    if (!user?.id || !userId) return;

    loadMessages();

    const messageChannel = supabase
      .channel(`messages-${user.id}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;

          // Only add messages belonging to this conversation
          const belongsToConversation =
            (newMessage.sender_id === user.id &&
              newMessage.receiver_id === userId) ||
            (newMessage.sender_id === userId &&
              newMessage.receiver_id === user.id);

          if (!belongsToConversation) {
            return;
          }

          setMessages((currentMessages) => {
            // Prevent duplicates
            if (
              currentMessages.some(
                (message) => message.id === newMessage.id
              )
            ) {
              return currentMessages;
            }

            return [...currentMessages, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [user?.id, userId]);

  // --------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------

const sendMessage = async () => {
  if (!user?.id || !userId) return;

  const trimmedMessage = message.trim();

  if (!trimmedMessage || isSending) return;

  setIsSending(true);

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: userId,
        post_id: postId || null,
        content: trimmedMessage,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return;
    }

    // Immediately add the message to the screen
    if (data) {
      setMessages((currentMessages) => {
        if (
          currentMessages.some(
            (message) => message.id === data.id
          )
        ) {
          return currentMessages;
        }

        return [...currentMessages, data];
      });
    }

    // Clear input
    setMessage("");

  } catch (error) {
    console.error("Error sending message:", error);
  } finally {
    setIsSending(false);
  }
};

  // --------------------------------------------------
  // MESSAGE UI
  // --------------------------------------------------

  const renderMessage = ({
    item,
  }: {
    item: Message;
  }) => {
    const isMyMessage = item.sender_id === user?.id;

    return (
      <View
        style={[
          styles.messageRow,
          isMyMessage
            ? styles.myMessageRow
            : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? styles.myMessageBubble
              : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage
                ? styles.myMessageText
                : styles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>

          <Text
            style={[
              styles.messageTime,
              isMyMessage
                ? styles.myMessageTime
                : styles.otherMessageTime,
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color="#333"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (userId) {
                router.push({
                  pathname: "/details",
                  params: { userId },
                });
              }
            }}
          >
            {otherUser?.profile_image_url ? (
              <Image
                source={{
                  uri: otherUser.profile_image_url,
                }}
                style={styles.headerImage}
              />
            ) : (
              <View style={styles.headerPlaceholder}>
                <Text style={styles.headerInitial}>
                  {otherUser?.name?.[0]?.toUpperCase() ||
                    "U"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.headerName}>
            {otherUser?.name || "User"}
          </Text>
        </View>

        {/* MESSAGES */}

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* INPUT */}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!isSending}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              isSending && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={isSending}
          >
            <Ionicons
              name="send"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  keyboardContainer: {
    flex: 1,
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  backButton: {
    padding: 5,
    marginRight: 8,
  },

  headerImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  headerPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },

  headerInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
  },

  headerName: {
    marginLeft: 12,
    fontSize: 17,
    fontWeight: "600",
  },

  messagesList: {
    flex: 1,
  },

  messagesContainer: {
    padding: 15,
    paddingBottom: 10,
  },

  messageRow: {
    flexDirection: "row",
    marginBottom: 8,
  },

  myMessageRow: {
    justifyContent: "flex-end",
  },

  otherMessageRow: {
    justifyContent: "flex-start",
  },

  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },

  myMessageBubble: {
    backgroundColor: "#6C63FF",
    borderBottomRightRadius: 4,
  },

  otherMessageBubble: {
    backgroundColor: "#f1f1f1",
    borderBottomLeftRadius: 4,
  },

  messageText: {
    fontSize: 16,
  },

  myMessageText: {
    color: "#fff",
  },

  otherMessageText: {
    color: "#333",
  },

  messageTime: {
    fontSize: 10,
    marginTop: 3,
    alignSelf: "flex-end",
  },

  myMessageTime: {
    color: "#ddd",
  },

  otherMessageTime: {
    color: "#888",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },
});
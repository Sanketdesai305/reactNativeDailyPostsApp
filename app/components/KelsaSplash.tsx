import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface KelsaSplashProps {
  onFinish?: () => void;
}

export default function KelsaSplash({
  onFinish,
}: KelsaSplashProps) {
  const logoOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const logoScale = useRef(
    new Animated.Value(0.85)
  ).current;

  const taglineOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const line1Y = useRef(
    new Animated.Value(15)
  ).current;

  const line2Y = useRef(
    new Animated.Value(15)
  ).current;

  const line3Y = useRef(
    new Animated.Value(15)
  ).current;

  useEffect(() => {
    Animated.sequence([
      // -------------------------
      // KELSA APPEARS
      // -------------------------
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(250),

      // -------------------------
      // TAGLINE
      // -------------------------
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),

        Animated.timing(line1Y, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),

        Animated.timing(line2Y, {
          toValue: 0,
          duration: 500,
          delay: 100,
          useNativeDriver: true,
        }),

        Animated.timing(line3Y, {
          toValue: 0,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),

      // Keep logo visible
      Animated.delay(700),

      // -------------------------
      // FADE OUT
      // -------------------------
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onFinish?.();
      }
    });
  }, []);

  return (
    <View style={styles.container}>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: logoOpacity,
            transform: [
              {
                scale: logoScale,
              },
            ],
          },
        ]}
      >

        {/* LOGO */}

        <Text style={styles.logo}>
          Kelsa
        </Text>

        {/* TAGLINE */}

        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineOpacity,
            },
          ]}
        >

          <Animated.Text
            style={[
              styles.tagline,
              {
                transform: [
                  {
                    translateY: line1Y,
                  },
                ],
              },
            ]}
          >
            Your Job.
          </Animated.Text>

          <Animated.Text
            style={[
              styles.tagline,
              {
                transform: [
                  {
                    translateY: line2Y,
                  },
                ],
              },
            ]}
          >
            Your Budget.
          </Animated.Text>

          <Animated.Text
            style={[
              styles.tagline,
              {
                transform: [
                  {
                    translateY: line3Y,
                  },
                ],
              },
            ]}
          >
            Your Terms.
          </Animated.Text>

        </Animated.View>

      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    alignItems: "center",
  },

  logo: {
    fontSize: 58,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#0a0a0a",
  },

  taglineContainer: {
    marginTop: 14,
    alignItems: "center",
  },

  tagline: {
    fontSize: 17,
    fontWeight: "500",
    color: "#555",
    lineHeight: 25,
  },
});
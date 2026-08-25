export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    console.log("NATIVE INTENT:", path);

    // Password reset
    if (
      path.includes("reset-password") ||
      path.includes("resetPassword")
    ) {
      return "/reset-password";
    }

    // Google OAuth callback
    if (
      path.includes("auth/callback") ||
      path.includes("callback")
    ) {
      return "/callback";
    }

    return path;
  } catch (error) {
    console.error(
      "redirectSystemPath error:",
      error
    );

    return "/";
  }
}
import { supabase } from "@/lib/supabase/client";
const getProfile = async (userId: string) => {
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
    console.error("Error fetching profile:", error);
    throw error;
  }

  return data;
};

export default getProfile;
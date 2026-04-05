import { supabase } from "../supabaseClient.js";
import { upsertProfile } from "./profiles";

function buildProfilePayload({
  email,
  fullName,
  phone = "",
  dateOfBirth = "",
  gender = "",
  city = "",
}) {
  return {
    email,
    full_name: fullName,
    phone: phone || null,
    date_of_birth: dateOfBirth || null,
    gender: gender || null,
    city: city || null,
  };
}

export async function signUpUser({
  email,
  password,
  fullName,
  phone = "",
  dateOfBirth = "",
  gender = "",
  city = "",
}) {
  try {
    const profilePayload = buildProfilePayload({
      email,
      fullName,
      phone,
      dateOfBirth,
      gender,
      city,
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: profilePayload },
    });

    if (error) return { user: null, error };

    const user = data?.user;
    if (!user) {
      return { user: null, error: { message: "Signup failed. No user returned." } };
    }

    const { error: profileError } = await upsertProfile(
      { id: user.id, ...profilePayload },
      { onConflict: "id" },
    );

    if (profileError) console.error("Profile insert error:", profileError.message);

    return { user, error: null };
  } catch (err) {
    return { user: null, error: { message: err.message || "Unexpected error" } };
  }
}

export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error };
    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: { message: err.message || "Unexpected error" } };
  }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  return { data, error };
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function forgotPassword(email) {
  if (!email) return { data: null, error: { message: "Email required" } };
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export async function resetPassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { data: null, error: { message: "Password must be 6+ chars" } };
  }
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id, full_name, password } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID de usuario es requerido" }, { status: 400 });
    }

    // Initialize Supabase Admin Client with Service Role Key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Update user in Supabase Auth if password or full_name is provided
    const updateData: any = {};
    if (password) updateData.password = password;
    if (full_name) updateData.user_metadata = { full_name };

    if (Object.keys(updateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        updateData
      );

      if (authError) {
        console.error("Auth Update Error:", authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    }

    // 2. Update profile in user_profiles table if full_name is provided
    if (full_name) {
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .update({ full_name })
        .eq("id", id);

      if (profileError) {
        console.error("Profile Update Error:", profileError);
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unexpected Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

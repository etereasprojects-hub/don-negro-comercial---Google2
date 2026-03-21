import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
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

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "mayorista" }
    });

    if (authError) {
      console.error("Auth Error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Create profile in user_profiles table
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert([
        { 
          id: authData.user.id, 
          email: email, 
          role: "mayorista", 
          active: true 
        }
      ]);

    if (profileError) {
      console.error("Profile Error:", profileError);
      // If profile creation fails, we might want to delete the auth user, 
      // but for now we'll just return the error.
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error: any) {
    console.error("Unexpected Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

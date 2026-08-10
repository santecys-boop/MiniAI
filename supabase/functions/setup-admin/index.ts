import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const email = "minihizmet@gmail.com";
  const password = "Mn!7xQ2v-Pk9$Lr4W#eZbT8yH";

  let userId: string | null = null;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { display_name: "Admin" },
  });
  if (cErr) {
    // maybe exists — find it
    const { data: list } = await admin.auth.admin.listUsers();
    const found = list?.users.find((u) => u.email === email);
    if (!found) return new Response(JSON.stringify({ error: cErr.message }), { status: 500 });
    userId = found.id;
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  } else {
    userId = created.user!.id;
  }

  await admin.from("profiles").upsert({ id: userId, email, display_name: "Admin", promo_unlimited: true });
  await admin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  return new Response(JSON.stringify({ ok: true, userId, email }), { headers: { "Content-Type": "application/json" } });
});

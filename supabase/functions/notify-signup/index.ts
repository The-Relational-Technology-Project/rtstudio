 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
 
 const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface SignupNotificationRequest {
   email: string;
   name?: string;
 }
 
 const handler = async (req: Request): Promise<Response> => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { email, name }: SignupNotificationRequest = await req.json();
 
     if (!email) {
       throw new Error("Email is required");
     }
 
     const displayName = name || "Not provided yet";
     const timestamp = new Date().toLocaleString("en-US", {
       timeZone: "America/New_York",
       dateStyle: "medium",
       timeStyle: "short",
     });
 
     const emailResponse = await resend.emails.send({
       from: "Relational Tech Studio <notifications@relationaltechproject.org>",
       to: ["josh@relationaltechproject.org"],
       subject: `🌱 New Studio signup: ${email}`,
       html: `
         <div style="font-family: Georgia, serif; max-width: 500px; padding: 20px;">
           <h2 style="color: #3d3129; margin-bottom: 16px;">New Account Created</h2>
           <p style="color: #7a6d61; line-height: 1.6;">
             Someone just joined the Relational Tech Studio!
           </p>
           <div style="background: #f7f0e8; padding: 16px; border-radius: 8px; margin: 20px 0;">
             <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${email}</p>
             <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${displayName}</p>
             <p style="margin: 0; color: #7a6d61; font-size: 14px;"><strong>Time:</strong> ${timestamp} ET</p>
           </div>
           <p style="color: #7a6d61; font-size: 14px;">
             — Relational Tech Studio
           </p>
         </div>
       `,
     });
 
     console.log("Signup notification sent:", emailResponse);
 
     return new Response(
       JSON.stringify({ success: true }),
       { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
     );
   } catch (error: any) {
     console.error("Error in notify-signup:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
     );
   }
 };
 
 serve(handler);
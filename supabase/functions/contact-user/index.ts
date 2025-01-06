import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts'

const sendEmail = async(emailTo, nameTo,content, subject) => {
  // Call post to the https://dqundwtpkgtfhreonqkd.supabase.co/functions/v1/send-email endpoint
  const response = await fetch('https://dqundwtpkgtfhreonqkd.supabase.co/functions/v1/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      'Authorization': 'Bearer ' + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    },
    body: JSON.stringify({
      emailTo,
      nameTo,
      content,
      subject
    })
  });

  console.log(response);
}


serve(async (req)=>{

    // Enable CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
        global: {
            headers: {
                Authorization: ("Bearer " + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? ""
            }
        }
    });
    try {
        const data = await req.json();
        const from = data.from;
        const toEmail = data.toEmail;
        const toName = data.toName;
        const propertyName = data.propertyName;
        const message = data.message;

        // Prepare all content
        let content = `Hello ${toName}, ${from} is interested in your property ${propertyName}.`;
        content += `\This is their message: ${message}`;


        await sendEmail(toEmail, toName, content, "Someone is interested in your property");
        

        return new Response(JSON.stringify({
            message: "Email sent successfully"
        }), {
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            },
            status: 200
        });
    } catch (error) {
        return new Response(JSON.stringify({
            message: error.message
        }), {
            headers: {
                "Content-Type": "application/json"
            },
            status: 400
        });
    }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts'

const createUser = async (supabase, email, password)=>{
    const { data , error  } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
    });
    if (error) throw error;
    return data;
};

// Function to send an email via Brevo API using fetch
const sendEmail = async (emailTo, nameTo, content, subject) => {
  const apiKey = Deno.env.get('BREVO_API_KEY');

  console.log('Sending email...');

  const payload = {
    sender: {
      name: 'Vid Potocnik',
      email: 'vid.slovenia7@gmail.com'
    },
    to: [
      {
        email: emailTo,
        name: nameTo
      }
    ],
    subject: subject,
    htmlContent: content
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Email sent successfully:', data);
  } catch (error: any) {
    console.error('Failed to send email:', error.message);
  }
};



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
        const { emailTo, nameTo, content, subject } = data;
        await sendEmail(emailTo, nameTo, content, subject);

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

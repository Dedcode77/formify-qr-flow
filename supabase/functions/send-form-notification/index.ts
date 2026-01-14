import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  formId: string;
  formName: string;
  responseData: Record<string, unknown>;
  ownerEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send form notification");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formId, formName, responseData, ownerEmail }: NotificationRequest = await req.json();

    console.log(`Sending notification for form: ${formName} to ${ownerEmail}`);

    // Format the response data for the email
    const responseHtml = Object.entries(responseData)
      .map(([key, value]) => {
        let displayValue = value;
        if (typeof value === 'boolean') {
          displayValue = value ? 'Oui' : 'Non';
        } else if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else if (typeof value === 'string' && value.startsWith('data:image')) {
          displayValue = '[Signature]';
        }
        return `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${key}</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${displayValue || '-'}</td></tr>`;
      })
      .join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📬 Nouvelle réponse reçue</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Une nouvelle réponse a été soumise au formulaire <strong>"${formName}"</strong>.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tbody>
                ${responseHtml}
              </tbody>
            </table>
          </div>
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Envoyé par FormFlow • ${new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend REST API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FormFlow <onboarding@resend.dev>",
        to: [ownerEmail],
        subject: `Nouvelle réponse au formulaire "${formName}"`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, data: emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-form-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

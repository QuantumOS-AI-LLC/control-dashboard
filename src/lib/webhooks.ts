export async function triggerJobWebhook(payload: any) {
  const webhookUrl = process.env.ONBOARDING_WEBHOOK_URL;
  const apiKey = process.env.INTERNAL_API_KEY;

  if (!webhookUrl) {
    console.warn("Webhook URL not configured (ONBOARDING_WEBHOOK_URL)");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        source: "Control Dashboard",
        timestamp: new Date().toISOString(),
        ...payload
      }),
    });

    if (!response.ok) {
      console.error(`Webhook failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error triggering webhook:", error);
  }
}

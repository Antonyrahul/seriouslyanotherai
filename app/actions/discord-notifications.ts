"use server";

export interface DiscordNotification {
  title: string;
  description: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

// Color scheme for different notification types
const COLORS = {
  SUCCESS: 0x00ff00, // Green
  INFO: 0x000000, // Black
  WARNING: 0xffaa00, // Orange
  ERROR: 0xff0000, // Red
  UPDATE: 0xffaa00, // Orange
  ADVERTISEMENT: 0x0000ff, // Blue
} as const;

// Core Discord webhook notification sender
export async function sendDiscordNotification(
  notification: DiscordNotification
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("DISCORD_WEBHOOK_URL not configured - notification skipped");
    return;
  }

  const embed = {
    title: notification.title,
    description: notification.description,
    color: notification.color || COLORS.INFO,
    timestamp: new Date().toISOString(),
    fields: notification.fields || [],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      console.error("Error sending Discord notification:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending Discord notification:", error);
  }
}

// Notify team when new customer registers
export async function notifyNewCustomer(data: {
  userEmail?: string;
  userName?: string;
}): Promise<void> {
  await sendDiscordNotification({
    title: "👤 New Customer",
    description: `A new customer has been created`,
    color: COLORS.INFO,
    fields: [
      {
        name: "User",
        value: data.userName || "Unknown",
        inline: true,
      },
      {
        name: "Email",
        value: data.userEmail || "Unknown",
        inline: true,
      },
    ],
  });
}

// Notify team when advertisement campaign is purchased
export async function notifyNewAdvertisement(data: {
  userEmail?: string;
  userName?: string;
  toolName: string;
  amount: number;
  currency: string;
  duration: string;
}): Promise<void> {
  await sendDiscordNotification({
    title: "📢 New Paid Advertisement",
    description: `A user has paid to advertise a tool`,
    color: COLORS.ADVERTISEMENT,
    fields: [
      {
        name: "User",
        value: data.userName || data.userEmail || "Unknown",
        inline: true,
      },
      {
        name: "Tool",
        value: data.toolName,
        inline: true,
      },
      {
        name: "Amount",
        value: `${data.amount / 100} ${data.currency.toUpperCase()}`,
        inline: true,
      },
      {
        name: "Duration",
        value: data.duration,
        inline: true,
      },
    ],
  });
}

// Notify team when subscription is updated
export async function notifySubscriptionUpdate(): Promise<void> {
  await sendDiscordNotification({
    title: "💳 Subscription Update",
    description: "A user's subscription has been updated",
    color: COLORS.SUCCESS,
  });
}

// Notify team when new subscription is created
export async function notifySubscriptionNew(): Promise<void> {
  await sendDiscordNotification({
    title: "💳 Subscription New",
    description: "A user's subscription has been created",
    color: COLORS.SUCCESS,
  });
}

import "server-only";

export type DiscordChannel = "events" | "feedback";

export type DiscordField = { name: string; value: string; inline?: boolean };

export type DiscordEmbed = {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordField[];
  timestamp?: string;
};

export const DISCORD_COLORS = {
  blue: 0x3b82f6,
  green: 0x10b981,
  purple: 0x8b5cf6,
  red: 0xef4444,
  amber: 0xf59e0b,
} as const;

function getWebhookUrl(channel: DiscordChannel): string | null {
  const url =
    channel === "events"
      ? process.env.DISCORD_WEBHOOK_EVENTS
      : process.env.DISCORD_WEBHOOK_FEEDBACK;
  return url && url.startsWith("https://") ? url : null;
}

export async function notifyDiscord(
  channel: DiscordChannel,
  embed: DiscordEmbed,
): Promise<void> {
  const url = getWebhookUrl(channel);
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            ...embed,
            timestamp: embed.timestamp ?? new Date().toISOString(),
          },
        ],
      }),
    });
    if (!res.ok) {
      console.warn(
        `[discord] webhook ${channel} returned ${res.status} ${res.statusText}`,
      );
    }
  } catch (err) {
    console.warn(`[discord] webhook ${channel} failed`, err);
  }
}

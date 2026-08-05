import webPush from "web-push";
import { db } from "@/lib/db";

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await db.pushSubscription.findMany({
    where: { userId },
  });

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "statusCode" in err &&
          ((err as { statusCode: number }).statusCode === 404 ||
            (err as { statusCode: number }).statusCode === 410)
        ) {
          await db.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw err;
      }
    }),
  );

  return results;
}

export async function sendPushToHousehold(
  householdId: string,
  payload: PushPayload,
  excludeUserId?: string,
) {
  const members = await db.membership.findMany({
    where: { householdId, leftAt: null },
    select: { userId: true },
  });

  const userIds = members
    .map((m) => m.userId)
    .filter((id) => id !== excludeUserId);

  await Promise.allSettled(
    userIds.map((uid) => sendPushToUser(uid, payload)),
  );
}

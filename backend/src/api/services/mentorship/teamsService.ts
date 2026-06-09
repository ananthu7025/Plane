import "isomorphic-fetch";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import { logger } from "../../../utils/logger.js";
import { TeamsMeetingCreationError } from "../../../utils/errors.js";
import type { TeamsOnlineMeeting } from "../../../types/mentorship.js";

const TENANT_ID        = process.env.TEAMS_TENANT_ID!;
const CLIENT_ID        = process.env.TEAMS_CLIENT_ID!;
const CLIENT_SECRET    = process.env.TEAMS_CLIENT_SECRET!;
const ORGANIZER_ID     = process.env.TEAMS_ORGANIZER_USER_ID!;
const DURATION_MINUTES = parseInt(process.env.TEAMS_MEETING_DURATION_MINUTES ?? "60", 10);

let msalClient: ConfidentialClientApplication | null = null;

function getMsalClient(): ConfidentialClientApplication {
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
        clientSecret: CLIENT_SECRET,
      },
    });
  }
  return msalClient;
}

/** Decode JWT payload (no signature verify — diagnostics only) */
function decodeTokenClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

/**
 * Acquire an access token via client credentials flow
 */
async function getAccessToken(): Promise<string> {
  const result = await getMsalClient().acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!result?.accessToken) {
    throw new TeamsMeetingCreationError("Failed to acquire Microsoft Graph access token");
  }

  const claims = decodeTokenClaims(result.accessToken);
  logger.info("Graph token acquired", "MENTORSHIP", {
    appid:  claims["appid"]  ?? claims["azp"],
    tid:    claims["tid"],
    roles:  claims["roles"]  ?? [],
    fromCache: result.fromCache,
  });

  return result.accessToken;
}

/**
 * Create a Teams online meeting for the configured organizer
 */
export async function createTeamsMeeting(
  subject: string,
  startDateTime: Date
): Promise<TeamsOnlineMeeting> {
  const endDateTime = new Date(startDateTime.getTime() + DURATION_MINUTES * 60 * 1000);

  logger.info("Creating Teams meeting", "MENTORSHIP", {
    organizerId: ORGANIZER_ID,
    subject,
    startDateTime: startDateTime.toISOString(),
  });

  const token = await getAccessToken();

  const graph = Client.init({
    authProvider: (done) => done(null, token),
  });

  const meeting = await graph
    .api(`/users/${ORGANIZER_ID}/onlineMeetings`)
    .post({
      subject,
      startDateTime: startDateTime.toISOString(),
      endDateTime:   endDateTime.toISOString(),
    });

  logger.info("Teams meeting created", "MENTORSHIP", { meetingId: meeting.id, subject });

  return {
    id:            meeting.id,
    joinWebUrl:    meeting.joinWebUrl,
    startDateTime: meeting.startDateTime,
    endDateTime:   meeting.endDateTime,
  };
}

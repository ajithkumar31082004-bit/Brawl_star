// AWS SNS Notification Service for Battleverse Backend

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Create SNS Client using EC2 IAM Role automatically or environment credentials
const snsClient = new SNSClient({ region: AWS_REGION });

export interface SNSNotificationPayload {
  subject: string;
  message: string;
}

/**
 * Publish an alert/event to the Battleverse AWS SNS Topic
 */
export async function publishSNSEvent({ subject, message }: SNSNotificationPayload): Promise<boolean> {
  if (!SNS_TOPIC_ARN) {
    console.log(`[AWS SNS Mock] Subject: ${subject} | Message: ${message}`);
    return true;
  }

  try {
    const command = new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: `[BATTLEVERSE] ${subject}`,
      Message: message,
    });

    const response = await snsClient.send(command);
    console.log(`[AWS SNS] Successfully published message ID: ${response.MessageId}`);
    return true;
  } catch (error) {
    console.warn('[AWS SNS] Failed to publish notification to SNS:', error);
    return false;
  }
}

/**
 * Event helper for new player registration
 */
export async function notifyUserRegistration(username: string, email: string) {
  return publishSNSEvent({
    subject: 'New Player Registered',
    message: `A new champion "${username}" (${email}) has joined Battleverse!`,
  });
}

/**
 * Event helper for match completion
 */
export async function notifyMatchCompleted(matchId: string, winningTeam: string, duration: number) {
  return publishSNSEvent({
    subject: '3v3 Match Completed',
    message: `Match ${matchId} concluded. Winning Team: ${winningTeam.toUpperCase()} (Duration: ${duration}s).`,
  });
}

# AWS SNS Topic for Battleverse Notifications
resource "aws_sns_topic" "notifications" {
  name = "${local.name_prefix}-notifications"

  tags = {
    Name = "${local.name_prefix}-notifications"
  }
}

# Email Subscription (Requires confirmation from inbox)
resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

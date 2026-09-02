# 1. IAM Role for EC2
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-ec2-role"
  }
}

# 2. Least Privilege Policy for SNS Publishing
resource "aws_iam_policy" "sns_publish" {
  name        = "${local.name_prefix}-sns-publish-policy"
  description = "Allows Battleverse EC2 instance to publish to the notification SNS topic"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.notifications.arn
      }
    ]
  })
}

# 3. Attach Policy to Role
resource "aws_iam_role_policy_attachment" "sns_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.sns_publish.arn
}

# 4. Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name
}

output "vpc_id" {
  description = "ID of the Battleverse VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.app_server.id
}

output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.app_server.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.app_server.public_dns
}

output "rds_endpoint" {
  description = "Connection endpoint for RDS MySQL"
  value       = aws_db_instance.mysql.endpoint
}

output "rds_address" {
  description = "Hostname of the RDS MySQL instance"
  value       = aws_db_instance.mysql.address
}

output "rds_port" {
  description = "Port for the RDS MySQL instance"
  value       = aws_db_instance.mysql.port
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.notifications.arn
}

output "application_url" {
  description = "Direct HTTP Application URL"
  value       = "http://${aws_instance.app_server.public_ip}"
}

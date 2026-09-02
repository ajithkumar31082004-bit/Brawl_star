variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "battleverse"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet (EC2)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets across 2 AZs (RDS)"
  type        = list(string)
  default     = ["10.0.2.0/24", "10.0.3.0/24"]
}

variable "instance_type" {
  description = "EC2 Instance type"
  type        = string
  default     = "t3.micro"
}

variable "admin_cidr" {
  description = "CIDR block allowed to access SSH"
  type        = string
  default     = "0.0.0.0/0"
}

variable "ec2_key_name" {
  description = "AWS EC2 Key Pair name for SSH access (optional)"
  type        = string
  default     = ""
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "battleverse_db"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "battleverse_admin"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
  default     = "BattleVerse2026SecurePass!"
}

variable "db_instance_class" {
  description = "RDS MySQL instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "notification_email" {
  description = "Email address for SNS game notifications"
  type        = string
  default     = "ajithkumar31082004@gmail.com"
}

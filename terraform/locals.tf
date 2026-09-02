locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = "Battleverse"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "Ajithkumar"
  }
}

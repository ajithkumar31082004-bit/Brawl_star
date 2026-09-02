# 1. DB Subnet Group (Across 2 Private Subnets)
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "${local.name_prefix}-db-subnet-group"
  }
}

# 2. RDS MySQL Instance (Private & Secure)
resource "aws_db_instance" "mysql" {
  identifier           = "${local.name_prefix}-mysql"
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  max_allocated_storage = 50
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  tags = {
    Name = "${local.name_prefix}-rds-mysql"
  }
}

# ==========================================
# Amazon RDS MySQL Multi-AZ Database
# ==========================================

resource "aws_db_subnet_group" "main" {
  name       = "battleverse-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "battleverse-db-subnet-group"
  }
}

resource "aws_security_group" "rds" {
  name        = "battleverse-rds-sg"
  description = "Allow inbound MySQL traffic from ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = 3306
    to_port         = 3306
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "battleverse-rds-sg"
  }
}

resource "aws_db_instance" "main" {
  identifier             = "battleverse-mysql-prod"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.db_instance_class
  db_name                = var.db_name
  username               = "battleverse_admin"
  password               = "ChangeMeInSecretsManager2026!"
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  multi_az               = true
  storage_encrypted      = true

  tags = {
    Name = "battleverse-mysql"
  }
}

# ==========================================
# Amazon ElastiCache Redis Cluster
# ==========================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "battleverse-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "redis" {
  name        = "battleverse-redis-sg"
  description = "Allow inbound Redis traffic from ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = 6379
    to_port         = 6379
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "battleverse-redis-sg"
  }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "battleverse-redis"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  tags = {
    Name = "battleverse-redis"
  }
}

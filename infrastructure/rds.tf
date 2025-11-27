module "db" {
  source = "terraform-aws-modules/rds-aurora/aws"

  name           = "lms-db"
  engine         = "aurora-postgresql"
  engine_version = "14.5"
  instance_class = "db.r6g.large"

  instances = {
    1 = {}
    2 = {}
  }

  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.private_subnets

  create_db_subnet_group = true
  security_group_rules = {
    vpc_ingress = {
      cidr_blocks = module.vpc.private_subnets_cidr_blocks
    }
  }

  master_username = "lms_admin"
  master_password = var.db_password
  database_name   = "lms"

  skip_final_snapshot = true

  tags = {
    Environment = var.environment
    Project     = "LMS"
  }
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1" # Mumbai
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

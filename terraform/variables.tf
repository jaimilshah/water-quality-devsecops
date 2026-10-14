variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance type (t3.micro is free-tier eligible)"
  type        = string
  default     = "t3.micro"
}

variable "repo_url" {
  description = "Public Git repository the instance clones and builds the Docker image from"
  type        = string
  default     = "https://github.com/jaimilshah/water-quality-devsecops.git"
}

variable "repo_ref" {
  description = "Git branch or tag to deploy"
  type        = string
  default     = "main"
}

variable "app_port" {
  description = "Port the container listens on"
  type        = number
  default     = 8000
}

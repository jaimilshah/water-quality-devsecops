variable "key_name" {
  description = "Name of an existing EC2 key pair (used to SSH in as the ubuntu user)"
  type        = string
}

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance type. t4g = ARM, matching the image that Jenkins builds on an Apple-silicon Mac"
  type        = string
  default     = "t4g.micro"
}

variable "image" {
  description = "Docker image in AWS public ECR that the server runs"
  type        = string
  default     = "public.ecr.aws/v0x5n8i4/water-quality-monitor:latest"
}

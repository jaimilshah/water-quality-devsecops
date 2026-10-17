variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair to attach to the instance"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type (t4g = ARM, matching the image Jenkins builds on an Apple-silicon Mac)"
  type        = string
  default     = "t4g.micro"
}

variable "vpc_cidr" {
  description = "CIDR block for the lab VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "ssh_source_cidr" {
  description = "CIDR allowed to SSH into the instance - restrict this to your IP in real use"
  type        = string
  default     = "0.0.0.0/0"
}

variable "image" {
  description = "Docker image in AWS public ECR that the server runs"
  type        = string
  default     = "public.ecr.aws/v0x5n8i4/water-quality-monitor:latest"
}

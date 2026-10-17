# Ports used by this project: 22 SSH, 80 website, 443 HTTPS, 5000 app dev port.
# (Jenkins 8080 and SonarQube 9000 run on the laptop, not on this server, so they are not opened.)
resource "aws_security_group" "lab_sg" {
  name        = "wq-devsecops-sg-tf"
  description = "Lab security group provisioned by Terraform"
  vpc_id      = aws_vpc.lab_vpc.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_source_cidr] #trivy:ignore:AVD-AWS-0107 lab only, key-based SSH
  }

  ingress {
    description = "HTTP app"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] #trivy:ignore:AVD-AWS-0107 public website
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] #trivy:ignore:AVD-AWS-0107 public website
  }

  ingress {
    description = "App dev port"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] #trivy:ignore:AVD-AWS-0107 lab only
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"] #trivy:ignore:AVD-AWS-0104 needed to install Docker and pull the image from ECR
  }

  tags = { Name = "wq-devsecops-sg-tf" }
}

output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.lab_instance.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.lab_instance.public_dns
}

output "ssh_command" {
  description = "Command to SSH into the instance"
  value       = "ssh -i ${var.key_name}.pem ubuntu@${aws_instance.lab_instance.public_ip}"
}

output "website_url" {
  description = "Website address (allow ~3 minutes after apply for the first boot)"
  value       = "http://${aws_instance.lab_instance.public_ip}"
}

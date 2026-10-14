output "instance_id" {
  description = "EC2 instance id"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "Public IPv4 address of the web server"
  value       = aws_instance.web.public_ip
}

output "website_url" {
  description = "URL of the deployed dashboard (allow ~3 minutes for first boot)"
  value       = "http://${aws_instance.web.public_ip}"
}

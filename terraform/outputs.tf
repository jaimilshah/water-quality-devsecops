output "instance_public_ip" {
  description = "Public IP of the server (SSH as ubuntu, website on port 80)"
  value       = aws_instance.ubuntu.public_ip
}

output "website_url" {
  description = "Website address (allow ~3 minutes after apply for the first boot)"
  value       = "http://${aws_instance.ubuntu.public_ip}"
}

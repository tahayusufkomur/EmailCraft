output "server_ipv4" {
  value = hcloud_server.prod.ipv4_address
}

output "ssh_command" {
  value = "ssh root@${hcloud_server.prod.ipv4_address}"
}

output "app_url" {
  value = "https://${var.domain_prefix}.${var.cloudflare_zone_name}"
}

output "dns_record" {
  value = "${var.domain_prefix}.${var.cloudflare_zone_name}"
}

output "postgres_password" {
  value     = random_password.postgres.result
  sensitive = true
}

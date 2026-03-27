variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  sensitive   = true
}

variable "cloudflare_zone_name" {
  description = "Cloudflare zone (root domain)"
  default     = "contentor.app"
}

variable "domain_prefix" {
  description = "Subdomain prefix for the app"
  default     = "mailcraft"
}

variable "server_type" {
  description = "Hetzner server type"
  default     = "cx23"
}

variable "location" {
  description = "Hetzner datacenter location"
  default     = "fsn1"
}

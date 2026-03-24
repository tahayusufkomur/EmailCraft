terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ---------- SSH key ----------

data "hcloud_ssh_keys" "all" {}

resource "hcloud_ssh_key" "default" {
  count      = length(data.hcloud_ssh_keys.all.ssh_keys) > 0 ? 0 : 1
  name       = "default"
  public_key = file("~/.ssh/id_ed25519.pub")
}

locals {
  ssh_key_ids = length(data.hcloud_ssh_keys.all.ssh_keys) > 0 ? [data.hcloud_ssh_keys.all.ssh_keys[0].id] : [hcloud_ssh_key.default[0].id]
}

# ---------- Random password ----------

resource "random_password" "postgres" {
  length  = 24
  special = false
}

# ---------- Server ----------

resource "hcloud_server" "prod" {
  name        = "mailcraft-prod"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location
  ssh_keys    = local.ssh_key_ids

  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail

    # Install Docker
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Install git
    apt-get install -y git

    # Create app directory
    mkdir -p /opt/mailcraft

    # Enable Docker on boot
    systemctl enable docker
    systemctl start docker
  EOF
}

# ---------- Firewall ----------

resource "hcloud_firewall" "web" {
  name = "mailcraft-prod-fw"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "tcp"
    port            = "1-65535"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "udp"
    port            = "1-65535"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "icmp"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_firewall_attachment" "prod" {
  firewall_id = hcloud_firewall.web.id
  server_ids  = [hcloud_server.prod.id]
}

# ---------- DNS ----------

data "cloudflare_zone" "zone" {
  name = var.cloudflare_zone_name
}

resource "cloudflare_record" "app" {
  zone_id = data.cloudflare_zone.zone.id
  name    = var.domain_prefix
  content = hcloud_server.prod.ipv4_address
  type    = "A"
  ttl     = 1
  proxied = false
}

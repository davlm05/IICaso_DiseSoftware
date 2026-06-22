# Production infrastructure as code (README §2.9 IaC).
# Manages the API service, analytics worker, PostgreSQL, and Redis on Railway,
# plus the Cloudflare DNS record for the API. State lives in Terraform Cloud.

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.4"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  cloud {
    organization = "smartcart"
    workspaces { name = "production" }
  }
}

variable "railway_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "image_tag" {
  type        = string
  description = "Immutable image tag deployed to production (main-{sha})."
}

provider "railway" {
  token = var.railway_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "railway_project" "smartcart" {
  name = "smartcart"
}

resource "railway_environment" "production" {
  name       = "production"
  project_id = railway_project.smartcart.id
}

# ── Data stores ────────────────────────────────────────────────────────────────
resource "railway_service" "postgres" {
  name       = "postgres"
  project_id = railway_project.smartcart.id
  source_image = "postgres:17-alpine"
}

resource "railway_service" "redis" {
  name       = "redis"
  project_id = railway_project.smartcart.id
  source_image = "redis:7.2-alpine"
}

# ── Application services ───────────────────────────────────────────────────────
resource "railway_service" "api" {
  name         = "smartcart-api"
  project_id   = railway_project.smartcart.id
  source_image = "ghcr.io/smartcart/api:${var.image_tag}"
}

resource "railway_service" "analytics_worker" {
  name         = "analytics-worker"
  project_id   = railway_project.smartcart.id
  source_image = "ghcr.io/smartcart/analytics-worker:${var.image_tag}"
}

# ── DNS ────────────────────────────────────────────────────────────────────────
variable "cloudflare_zone_id" {
  type = string
}

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  type    = "CNAME"
  content = railway_service.api.domain
  proxied = true
}

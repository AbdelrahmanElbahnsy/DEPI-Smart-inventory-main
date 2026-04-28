variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "smart-inventory-rg"
}

variable "location" {
  description = "Azure region for deployment"
  type        = string
  default     = "East US"
}

variable "vm_size" {
  description = "Size of the Azure Virtual Machine"
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "repo_url" {
  description = "URL of the Git repository to clone"
  type        = string
  default     = "https://github.com/AbdelrahmanElbahnsy/DEPI-Smart-inventory-main.git"
}

variable "docker_compose_path" {
  description = "Path to the docker-compose.yml relative to repo root"
  type        = string
  default     = "infra/docker/docker-compose.yml"
}
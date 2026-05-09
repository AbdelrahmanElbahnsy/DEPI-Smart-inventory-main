variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "smart-inventory-rg-prod"
}

variable "location" {
  description = "Azure region for deployment"
  type        = string
  default     = "spaincentral"
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

variable "admin_password" {
  description = "Admin password for the VM"
  type        = string
  sensitive   = true
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
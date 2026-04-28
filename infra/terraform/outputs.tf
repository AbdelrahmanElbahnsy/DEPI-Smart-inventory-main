output "public_ip_address" {
  description = "The public IP address of the virtual machine"
  value       = azurerm_linux_virtual_machine.vm.public_ip_address
}

output "vm_id" {
  description = "The ID of the virtual machine"
  value       = azurerm_linux_virtual_machine.vm.id
}

output "frontend_url" {
  description = "The URL to access the Frontend application"
  value       = "http://${azurerm_linux_virtual_machine.vm.public_ip_address}"
}

output "api_urls" {
  description = "Endpoints for the various microservices"
  value = {
    backend_api   = "http://${azurerm_linux_virtual_machine.vm.public_ip_address}:5000"
    inventory_api = "http://${azurerm_linux_virtual_machine.vm.public_ip_address}:5001"
    alert_api     = "http://${azurerm_linux_virtual_machine.vm.public_ip_address}:5002"
  }
}
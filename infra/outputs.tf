output "control_plane_ip" {
  value = regcloud_server.control_plane.ip_address
}

output "worker_ip" {
  value = regcloud_server.worker.ip_address
}

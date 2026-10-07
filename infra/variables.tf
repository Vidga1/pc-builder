variable "regcloud_token" {
  type      = string
  sensitive = true
}

variable "region_slug" {
  type    = string
  default = "openstack-sam1"
}

variable "server_size" {
  type    = string
  default = "c2-m2-d40-ddc"
}

variable "server_image" {
  type    = string
  default = "ubuntu-24-04-amd64"
}

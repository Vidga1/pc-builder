resource "regcloud_ssh_key" "k8s" {
  name       = "k8sStudy"
  public_key = file(pathexpand("~/.ssh/regcloud-k8s.pub"))
}

resource "regcloud_server" "control_plane" {
  name        = "k8sControlPlane"
  size        = var.server_size
  image       = var.server_image
  region_slug = var.region_slug

  ssh_keys = [
    regcloud_ssh_key.k8s.fingerprint
  ]

  backups = false

  lifecycle {
    ignore_changes = [
      ssh_keys
    ]
  }
}

resource "regcloud_server" "worker" {
  name        = "k8sWorker"
  size        = var.server_size
  image       = var.server_image
  region_slug = var.region_slug

  ssh_keys = [
    regcloud_ssh_key.k8s.fingerprint
  ]

  backups = false

  lifecycle {
    ignore_changes = [
      ssh_keys
    ]
  }
}

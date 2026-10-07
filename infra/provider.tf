terraform {
  required_providers {
    regcloud = {
      source = "tf.reg.cloud/regru/regcloud"
    }
  }
}

provider "regcloud" {
  token   = var.regcloud_token
  api_url = "https://api.cloudvps.reg.ru"
}

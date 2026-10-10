# Kubernetes deployment

The former ansible/deploy.yml application deployment has been replaced by a
Helm chart. See [../DEPLOY.md](../DEPLOY.md) for the complete steps (including
one-time adoption of existing Kubernetes objects, secrets and database seeding).

Ansible is still used for node/bootstrap setup via site.yml and optional
K9s/Metrics Server via addons.yml.

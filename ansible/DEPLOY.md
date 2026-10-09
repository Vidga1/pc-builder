# Restore PC Builder on new REG.RU VMs

This playbook is for the learning cluster: one control-plane, one worker,
PostgreSQL stored on the worker's local disk. **No database backup** is created.
`terraform destroy` irreversibly deletes the database together with that disk.

## One-time local preparation (WSL)

1. After `terraform apply`, read new addresses with `terraform output` in `infra/`.
2. Replace `ansible_host` for both nodes in `ansible/inventory.ini`.
3. Terraform provisions the public SSH key at `~/.ssh/regcloud-k8s.pub`.
   Make sure Ansible's key (`~/.ssh/ansible-k8s`) is authorized on **both NEW VMs**
   again. Use the corresponding `~/.ssh/regcloud-k8s` private key to connect
   initially and install `~/.ssh/ansible-k8s.pub` using `ssh-copy-id`.
4. On REG.RU DNS, point the A record for `my-pc-builder.ru` to the **new worker**
   public IP. Ensure TCP 80 and 443 reach that worker; DNS must have updated
   before Let's Encrypt can issue a certificate.
5. From repository root create local file `.env.k8s` from
   `ansible/secrets.example`. Set real random values for both secrets,
   WITHOUT quotes. Generate examples with `openssl rand -hex 24` and
   `openssl rand -hex 32`. The file is already ignored by Git.
   **Never put credentials in GitHub.**
   If applying this playbook to an existing database, reuse its original
   PostgreSQL credentials: changing the Secret alone does not change
   the password inside PostgreSQL.

## Run

From the repository's `ansible/` directory, on local WSL:

```bash
ansible-playbook -i inventory.ini site.yml
ansible-playbook -i inventory.ini addons.yml
ansible-playbook -i inventory.ini deploy.yml
```

`deploy.yml` installs Helm, Traefik, cert-manager, and the manifests for
PostgreSQL, Next.js, ClusterIssuer and Ingress. It also creates the Kubernetes
Secret from local `.env.k8s`, then deletes its temporary copy from the server.

Prisma migrations run on app startup (see Dockerfile). On a completely empty
database, the playbook runs `prisma/seed.ts` once; it skips existing databases
because **that script deletes all old records**. The seed uses `npx tsx` and
needs access to the npm package registry inside the app container.

The container image `ghcr.io/vidga1/pc-builder:latest` must already exist and
be pullable by the Kubernetes node. If you changed application code, rebuild
and push that image separately.

## Check

On control-plane:

```bash
kubectl get nodes
helm list -A
kubectl get pods -n pc-builder
kubectl get certificate -n pc-builder
kubectl describe certificate pc-builder-tls -n pc-builder
```

The certificate should reach `READY=True` once Let's Encrypt has verified
`my-pc-builder.ru`. This can take minutes after changing DNS. The final
Ansible task reports certificate status; it does not wait for issuance.

Open https://my-pc-builder.ru when the certificate is ready.

## Limitations

- Inventory and DNS IP addresses are **not** updated automatically.
- PostgreSQL is a single StatefulSet on a worker's local disk: not fault tolerant.
- The test-user seed is suitable for a lab, not for real production.
- Helm updates, image publishing, firewall settings, and DNS remain separate
  operations; verify the site before running `terraform destroy`.

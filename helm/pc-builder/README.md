# PC Builder Helm chart

Installs the existing Next.js Deployment, PostgreSQL StatefulSet, Services and
HTTPS Ingress into namespace pc-builder. Use release name **pc-builder** so
resource names match the old manifests. Requires Kubernetes, Traefik,
cert-manager, ClusterIssuer letsencrypt-prod, and a Secret named
pc-builder-secrets with POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB and
NEXTAUTH_SECRET.

The Secret must be created **outside** Helm: values and release histories must
not contain plaintext credentials. The database uses the **existing**
worker-local hostPath /var/lib/pc-builder/postgres; this is not a backup or
high-availability database. Do not delete the worker VM or change the hostPath
without arranging data migration/backups.

Validate locally with:

~~~bash
helm lint helm/pc-builder
helm template pc-builder helm/pc-builder --namespace pc-builder > /tmp/pc-builder-rendered.yaml
~~~

Deploy via the steps in [DEPLOY.md](../../DEPLOY.md).
For a fresh cluster use helm upgrade --install; for **one-time adoption** of
resources created with kubectl apply use --take-ownership (Helm 3 with support
for that flag). Check the proposed diff and existing resource names first.

The Dockerfile runs Prisma migrations at app startup. Initial seed data is
deliberately **not** a Helm hook: prisma/seed.ts deletes existing rows.
Run the guarded helper in scripts/seed-if-empty.sh explicitly on a fresh DB,
after the Deployment is ready.

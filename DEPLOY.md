# Kubernetes deployment: Terraform + Ansible + Helm

Разделение ответственности:
- **Terraform** — создаёт две VM в REG.RU;
- **Ansible** (site.yml, при необходимости addons.yml) — готовит Linux и
  Kubernetes control-plane/worker;
- **Helm** — ставит Traefik, cert-manager и наше приложение с PostgreSQL.

Helm **не** устанавливает Kubernetes и не заменяет ansible/site.yml.

## 1. Подготовить серверы и кластер (локальная машина/WSL)

~~~bash
cd infra
terraform init
terraform apply
terraform output
cd ../ansible
# Обновить адреса ansible_host в inventory.ini по terraform output.
ansible-playbook -i inventory.ini site.yml
# Опционально: K9s и Metrics Server.
ansible-playbook -i inventory.ini addons.yml
cd ..
~~~

SSH-ключ и права доступа описаны в ansible/SITE.md и ansible/inventory.ini.
Обновите A-запись my-pc-builder.ru на публичный IP worker, откройте TCP
80/443 для worker. DNS должен разрешаться до запроса сертификата Let's Encrypt.
Нужен заранее опубликованный образ ghcr.io/vidga1/pc-builder:latest.

## 2. Передать конфигурацию на control-plane (локальная машина/WSL)

Создайте .env.k8s из ansible/secrets.example, задайте настоящие случайные
POSTGRES_PASSWORD и NEXTAUTH_SECRET. Файл игнорируется Git; не коммитьте его.
При подключении к **существующей** базе сохраняйте первоначальные значения
POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB: Secret не меняет пароль в базе.

~~~bash
cp ansible/secrets.example .env.k8s
# Отредактируйте .env.k8s и замените CHANGE_ME.
CONTROL_IP="$(cd infra && terraform output -raw control_plane_ip)"
ssh -i ~/.ssh/ansible-k8s "root@$CONTROL_IP" 'install -d -m 700 /opt/pc-builder'
scp -i ~/.ssh/ansible-k8s -r helm k8s scripts "root@$CONTROL_IP:/opt/pc-builder/"
# Передаём секрет с правами 600, не через аргументы команд или Git.
ssh -i ~/.ssh/ansible-k8s "root@$CONTROL_IP" \
  'umask 077; cat > /root/.pc-builder.k8s.env' < .env.k8s
ssh -i ~/.ssh/ansible-k8s "root@$CONTROL_IP"
~~~

Команды ниже выполняются **на control-plane**, после SSH-входа.

## 3. Установить платформенные компоненты

~~~bash
export KUBECONFIG=/etc/kubernetes/admin.conf

# Требуется Helm 3 с поддержкой --take-ownership для миграции старых ресурсов.
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \
  -o /tmp/get-helm-3.sh
bash /tmp/get-helm-3.sh
helm version --short

helm repo add traefik https://traefik.github.io/charts --force-update
helm repo update traefik
helm upgrade --install traefik traefik/traefik \
  --namespace traefik --create-namespace \
  -f /opt/pc-builder/k8s/traefik-values.yaml --wait --timeout 8m

helm upgrade --install cert-manager oci://quay.io/jetstack/charts/cert-manager \
  --version v1.21.2 --namespace cert-manager --create-namespace \
  --set crds.enabled=true --wait --timeout 8m

# ClusterIssuer — cluster-scoped ресурс, остаётся отдельным от app Helm release.
kubectl apply -f /opt/pc-builder/k8s/cluster-issuer.yaml
kubectl wait --for=condition=Ready clusterissuer/letsencrypt-prod --timeout=180s
~~~

## 4. Создать Secret и развернуть PC Builder

~~~bash
kubectl create namespace pc-builder --dry-run=client -o yaml | kubectl apply -f -
kubectl -n pc-builder create secret generic pc-builder-secrets \
  --from-env-file=/root/.pc-builder.k8s.env \
  --dry-run=client -o yaml | kubectl apply -f -
rm -f /root/.pc-builder.k8s.env

helm lint /opt/pc-builder/helm/pc-builder
helm template pc-builder /opt/pc-builder/helm/pc-builder \
  --namespace pc-builder > /tmp/pc-builder-rendered.yaml

# ВАЖНО: первый запуск на существующем кластере, где объекты были kubectl apply:
# --take-ownership передаёт Helm право управления СУЩЕСТВУЮЩИМИ
# Deployment/StatefulSet/Service/Ingress. Сначала проверьте имена и diff.
helm upgrade --install pc-builder /opt/pc-builder/helm/pc-builder \
  --namespace pc-builder --create-namespace \
  --take-ownership --wait --timeout 10m

kubectl get pods,svc,ingress,certificate -n pc-builder
helm list -A
~~~

При **первом развёртывании в чистом кластере** --take-ownership не нужен.
Последующие обновления — обычным helm upgrade --install, **без** этого
флага. Не запускайте прежний ansible/deploy.yml или kubectl apply для
удалённых k8s/app.yml, k8s/postgres.yml, k8s/service.yml и k8s/ingress.yaml:
теперь эти ресурсы принадлежат Helm. Возврат на старый способ требует
отдельной процедуры, не удаляйте Helm release вслепую.

## 5. Необязательное заполнение НОВОЙ базы

После успешного запуска приложения можно выполнить:

~~~bash
bash /opt/pc-builder/scripts/seed-if-empty.sh
~~~

Скрипт пропускает непустую базу. Seed **удаляет старые данные**, поэтому
он намеренно не включён в автоматические Helm upgrade/install. Ему
нужен доступ из app-контейнера к npm registry для npx tsx.

## Обновления, проверки и риски

~~~bash
helm upgrade pc-builder /opt/pc-builder/helm/pc-builder \
  --namespace pc-builder --wait --timeout 10m
helm history pc-builder -n pc-builder
kubectl get pods -n pc-builder
kubectl get certificate -n pc-builder
~~~

PostgreSQL остаётся на hostPath рабочего сервера и НЕ имеет отказоустойчивости
или резервного копирования. terraform destroy удаляет VM и её локальную БД.
Перед миграцией/обновлением сделайте backup PostgreSQL. DNS и публикация образа
остаются отдельными действиями. Helm rollback не откатывает миграции БД.

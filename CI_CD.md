# Автоматический деплой PC Builder через GitHub Actions

Workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

- **PR в main:** проверки Helm Chart и Docker build (без публикации образа и без SSH к VPS).
- **Push/merge в main:** Docker build, push в GHCR с тегом SHA коммита и Helm upgrade на REG.RU.
- **Ручной запуск:** workflow_dispatch (production обновляется только из main).
- Production-деплои выполняются последовательно, чтобы два push не обновляли кластер одновременно.

## Подготовка (один раз, до merge)

1. **Настройте кластер по [DEPLOY.md](DEPLOY.md).** Должны уже работать
   Kubernetes, Traefik, cert-manager, Secret `pc-builder-secrets` и Helm release
   `pc-builder`. Если старые ресурсы создавались через `kubectl apply`, выполните
   **однократное** принятие их под управление Helm командой из DEPLOY.md
   (`--take-ownership`), предварительно сделав backup PostgreSQL.
   Workflow **не** захватывает права на существующий StatefulSet автоматически.
2. **Проверьте доступность GHCR для worker.** Пакет
   `ghcr.io/vidga1/pc-builder` должен быть public в GitHub Packages
   (публичность репозитория не делает package автоматически публичным).
   Для private package создайте Kubernetes registry Secret `ghcr-credentials` в
   namespace `pc-builder` и добавьте в `helm/pc-builder/values.yaml`:

   ~~~yaml
   imagePullSecrets:
     - name: ghcr-credentials
   ~~~

   Для registry Secret нужен отдельный токен с правом чтения package
   (`read:packages`); не сохраняйте его в Git.
3. **Подготовьте SSH-доступ к control-plane.** Используйте отдельный deploy
   SSH-ключ, добавьте его публичную часть в authorized_keys на VPS.
   Для текущей конфигурации используется `/etc/kubernetes/admin.conf`,
   обычно читаемый только root. Поэтому workflow рассчитан на SSH-пользователя
   с правом читать этот файл (в текущем учебном кластере — `root`).
   Это права администратора к кластеру: для production лучше отдельный
   пользователь и ограниченный kubeconfig/RBAC.
4. **Добавьте в GitHub secrets** (Settings → Secrets and variables → Actions,
   либо secrets environment `production`):

   | Название | Что положить |
   | --- | --- |
   | `VPS_HOST` | Публичный IP **control-plane** |
   | `VPS_USER` | SSH-пользователь (в текущей схеме `root`) |
   | `VPS_SSH_KEY` | Приватный SSH-ключ целиком, с BEGIN/END |
   | `VPS_KNOWN_HOSTS` | Проверенная строка known_hosts для указанного IP |

   `VPS_KNOWN_HOSTS` можно предварительно получить командой
   `ssh-keyscan -H <CONTROL_IP>`, но отпечаток ключа **обязательно сверить**
   с реальным ключом сервера через доверенный канал. В workflow строго
   включена проверка host key; `StrictHostKeyChecking` не отключается.
   GitHub-hosted runner должен иметь сетевой доступ по SSH к control-plane.
5. При необходимости настройте **GitHub Environment → production**.
   Если включить required reviewers, автоматический деплой после push будет
   ждать ручного подтверждения.

## После каждого push в main

Workflow архивирует Chart **из того же коммита**, отправляет его на
control-plane по SSH и выполняет эквивалент:

~~~bash
export KUBECONFIG=/etc/kubernetes/admin.conf
helm upgrade pc-builder /path/to/pc-builder \
  --namespace pc-builder \
  --set-string image.tag=<commit SHA> \
  --wait --atomic --timeout 10m
kubectl rollout status deployment/pc-builder -n pc-builder
~~~

Тег SHA вместо `latest` гарантирует изменение Pod template и rollout.
Helm `--atomic` откатит Kubernetes-манифесты, если обновление не готово за
указанное время. **Prisma-миграции БД назад не откатываются** — нужны
совместимые миграции и backup PostgreSQL.

Workflow **не** хранит пароли БД: Pod продолжает использовать
`pc-builder-secrets`. Автоматический seed отключён, потому что
`prisma/seed.ts` удаляет существующие записи.

## Проверка и ошибки

Статус: GitHub → Actions → PC Builder CI/CD. На control-plane:

~~~bash
export KUBECONFIG=/etc/kubernetes/admin.conf
helm history pc-builder -n pc-builder
kubectl get pods -n pc-builder
kubectl describe deployment pc-builder -n pc-builder
~~~

Если падает деплой: проверьте SSH secrets/host key и порт 22, наличие
первоначального Helm release, доступность GHCR для worker и готовность Pod.

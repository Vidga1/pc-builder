# Дополнительные роли Ansible: K9s + Metrics Server

Содержимое архива распаковать прямо в существующую папку `pc-builder/ansible/`.
Исходные `inventory.ini`, `site.yml` и роли `common`, `control_plane`, `worker` не перезаписываются.

## Установить отдельно (кластер должен быть уже создан)

```bash
cd ~/projects/pc-builder/ansible
ansible-playbook -i inventory.ini addons.yml --syntax-check
ansible-playbook -i inventory.ini addons.yml
```

## Чтобы устанавливать вместе с основным кластером

После существующих plays в `site.yml` добавить:

```yaml
- name: Install K9s and Metrics Server
  hosts: control_plane
  become: true
  roles:
    - k9s
    - metrics_server
```

После этого один `ansible-playbook -i inventory.ini site.yml` при новом создании VM
настроит и кластер, и эти две роли. `addons.yml` тогда можно запускать
только для повторной отдельной настройки.

## Что устанавливается

- `k9s` — команда только на control-plane, никакие новые поды не создаёт;
  запускается через SSH: `k9s`.
- `metrics_server` — Deployment в `kube-system` для метрик CPU/RAM,
  проверка: `kubectl top nodes`, `kubectl top pods -n pc-builder`.

Версии зафиксированы: K9s v0.51.0 и Metrics Server v0.9.0.

**Безопасность:** `--kubelet-insecure-tls` отключает проверку сертификата kubelet,
потому что в данном учебном кластере сертификаты не имеют IP SAN.
Для реального production это нужно заменить правильно подписанными сертификатами,
а не оставлять отключённую проверку.

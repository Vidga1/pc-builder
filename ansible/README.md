# Kubernetes Ansible

Запуск из папки `ansible`:

```bash
ansible all -i inventory.ini -m ping
ansible-playbook -i inventory.ini site.yml --syntax-check
ansible-playbook -i inventory.ini site.yml
```

Playbook готовит обе ноды, ставит containerd/Kubernetes, инициализирует control-plane,
ставит Flannel, подключает worker и выводит `kubectl get nodes -o wide`.

Текущий inventory:
- control: 151.248.113.234
- worker: 151.248.113.189

SSH-ключ: `~/.ssh/ansible-k8s`

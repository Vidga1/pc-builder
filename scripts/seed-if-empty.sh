#!/usr/bin/env bash
# Run on a machine with kubectl access AFTER the app is ready.
# prisma/seed.ts deletes all rows; never invoke it without verifying emptiness.
set -euo pipefail

namespace="${NAMESPACE:-pc-builder}"

empty="$(kubectl -n "$namespace" exec postgres-0 -- \
  sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc '"'"'SELECT CASE WHEN
    (SELECT COUNT(*) FROM "Component") = 0 AND
    (SELECT COUNT(*) FROM "User") = 0 AND
    (SELECT COUNT(*) FROM "Build") = 0
    THEN 1 ELSE 0 END;'"'"'')"

if [[ "$empty" == "1" ]]; then
  echo "Fresh, empty DB: running the destructive seed exactly once."
  kubectl -n "$namespace" exec deployment/pc-builder -- npx --yes tsx prisma/seed.ts
else
  echo "Existing data detected (or unexpected result): skipping seed."
fi

#!/usr/bin/env bash
set -euo pipefail
set +x
umask 077

# Only fixed messages may reach stdout/stderr. Never print private files.
if [[ "${RUNNER_DEBUG:-0}" == "1" || "${ACTIONS_STEP_DEBUG:-false}" == "true" || "${ACTIONS_RUNNER_DEBUG:-false}" == "true" ]]; then
  echo "Execução indisponível com diagnóstico público ampliado."
  exit 1
fi
private_root=$(mktemp -d "$RUNNER_TEMP/routine.XXXXXXXX")
cleanup() {
  case "$private_root" in
    "$RUNNER_TEMP"/routine.*) rm -rf -- "$private_root" ;;
    *) return 1 ;;
  esac
}
trap cleanup EXIT
token=$(openssl rand -hex 24)
echo "::stop-commands::$token"
result=0
set +e
(
  set -euo pipefail
  unset GITHUB_ENV GITHUB_OUTPUT GITHUB_STEP_SUMMARY GITHUB_PATH ACTIONS_RUNTIME_TOKEN ACTIONS_RUNTIME_URL ACTIONS_RESULTS_URL
  [[ "${VALIDATE_ONLY:-}" == "true" || "${VALIDATE_ONLY:-}" == "false" ]]
  [[ "${ROUTINE:-}" == "a" || "${ROUTINE:-}" == "b" ]]
  [[ "${FAILURE_PROBE:-false}" != "true" || "$VALIDATE_ONLY" == "true" ]]
  [[ -n "${EXECUTION_CONFIG:-}" ]]
  printf '%s' "$EXECUTION_CONFIG" | jq -e 'type == "object" and .version == 1 and (.values | type == "object") and (keys | sort == ["key", "target", "values", "version"])' > /dev/null
  target=$(printf '%s' "$EXECUTION_CONFIG" | jq -er '.target | select(type == "string" and length > 0)')
  [[ "$target" =~ ^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$ ]]
  printf '%s' "$EXECUTION_CONFIG" | jq -er '.key | select(type == "string" and length > 0)' > "$private_root/key"
  curl --fail --silent --show-error --proto '=https' --tlsv1.2 https://api.github.com/meta |
    jq -er '.ssh_keys[] | "github.com " + .' > "$private_root/known_hosts"
  export GIT_SSH_COMMAND="ssh -i '$private_root/key' -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile='$private_root/known_hosts'"
  git init -q "$private_root/code"
  git -C "$private_root/code" remote add origin "git@github.com:$target.git"
  git -C "$private_root/code" fetch --quiet --depth=1 origin main
  git -C "$private_root/code" checkout --quiet --detach FETCH_HEAD
  rm -- "$private_root/key"
  EXECUTION_CONFIG=$(printf '%s' "$EXECUTION_CONFIG" | jq -c 'del(.key, .target)')
  export EXECUTION_CONFIG
  unset target GIT_SSH_COMMAND
  export PRIVATE_BOOTSTRAP_LOG="$private_root/bootstrap.log"
  export PRIVATE_EXECUTION_LOG="$private_root/execution.log"
  cd "$private_root/code"
  node scripts/hostedAutomation.cjs
) > "$private_root/bootstrap.log" 2>&1
result=$?
set -e
echo "::$token::"
if [[ "$result" == "0" ]]; then
  echo "Execução concluída com sucesso."
else
  echo "Não foi possível concluir a execução. Consulte o diagnóstico privado."
fi
exit "$result"

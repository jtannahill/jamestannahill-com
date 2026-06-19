#!/usr/bin/env bash
# Apply CAA records and tighten SPF for jamestannahill.com via Cloudflare API.
#
# Prerequisites:
#   export CLOUDFLARE_API_TOKEN="..."  # Zone → DNS → Edit (this zone)
#   export CLOUDFLARE_ZONE_ID="..."    # optional — script can resolve it
#
# Create token: Cloudflare Dashboard → My Profile → API Tokens → Create Token
#   Template: "Edit zone DNS" → Zone Resources: jamestannahill.com
#
# Usage: ./infra/cloudflare/apply-dns.sh

set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN (not the literal string \"...\")}"

CF_API="https://api.cloudflare.com/client/v4"

cf_api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local tmp http body
  tmp=$(mktemp)

  if [[ -n "${data}" ]]; then
    http=$(curl -sS -o "${tmp}" -w "%{http_code}" -X "${method}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "${data}" \
      "${CF_API}${path}")
  else
    http=$(curl -sS -o "${tmp}" -w "%{http_code}" -X "${method}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      "${CF_API}${path}")
  fi

  body=$(cat "${tmp}")
  rm -f "${tmp}"

  if [[ "${http}" -ge 400 ]]; then
    echo "Cloudflare API error (${http}) for ${method} ${path}" >&2
    echo "${body}" | jq -r '.errors[]? | "- \(.code): \(.message)"' >&2 2>/dev/null || echo "${body}" >&2
    return 1
  fi

  if ! echo "${body}" | jq -e '.success == true' >/dev/null 2>&1; then
    echo "Cloudflare API returned success=false for ${method} ${path}" >&2
    echo "${body}" | jq -r '.errors[]? | "- \(.code): \(.message)"' >&2 2>/dev/null || echo "${body}" >&2
    return 1
  fi

  echo "${body}"
}

verify_token() {
  echo "Verifying API token..."
  cf_api GET "/user/tokens/verify" >/dev/null
  echo "Token is valid."
}

resolve_zone_id() {
  if [[ -n "${CLOUDFLARE_ZONE_ID:-}" ]]; then
    echo "Using CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID}"
    cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}" >/dev/null
    return
  fi

  echo "Resolving zone ID for jamestannahill.com..."
  local body zone_id
  body=$(cf_api GET "/zones?name=jamestannahill.com&status=active")
  zone_id=$(echo "${body}" | jq -r '.result[0].id // empty')
  if [[ -z "${zone_id}" ]]; then
    echo "Could not find active zone jamestannahill.com for this token." >&2
    echo "Set CLOUDFLARE_ZONE_ID manually from Dashboard → jamestannahill.com → Overview (right column)." >&2
    exit 1
  fi
  CLOUDFLARE_ZONE_ID="${zone_id}"
  echo "Resolved CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID}"
}

dns_records_path() {
  echo "/zones/${CLOUDFLARE_ZONE_ID}/dns_records"
}

upsert_spf() {
  local content="v=spf1 include:_spf.mx.cloudflare.net include:icloud.com -all"
  local path record_id body

  path=$(dns_records_path)
  body=$(cf_api GET "${path}?type=TXT&name=jamestannahill.com")
  record_id=$(echo "${body}" | jq -r '.result[] | select(.content | startswith("v=spf1")) | .id' | head -1)

  local payload
  payload=$(jq -n --arg content "${content}" '{type:"TXT", name:"jamestannahill.com", content:$content, ttl:3600}')

  if [[ -n "${record_id}" ]]; then
    cf_api PUT "${path}/${record_id}" "${payload}" >/dev/null
    echo "Updated SPF TXT record (${record_id})"
  else
    cf_api POST "${path}" "${payload}" >/dev/null
    echo "Created SPF TXT record"
  fi
}

upsert_caa() {
  local tag="$1"
  local value="$2"
  local path record_id body payload

  path=$(dns_records_path)
  body=$(cf_api GET "${path}?type=CAA&name=jamestannahill.com")
  record_id=$(echo "${body}" | jq -r --arg tag "${tag}" --arg value "${value}" \
    '.result[] | select(.data.tag == $tag and .data.value == $value) | .id' | head -1)

  if [[ -n "${record_id}" ]]; then
    echo "CAA ${tag} ${value} already exists"
    return
  fi

  payload=$(jq -n --arg tag "${tag}" --arg value "${value}" \
    '{type:"CAA", name:"jamestannahill.com", data:{flags:0, tag:$tag, value:$value}, ttl:3600}')

  cf_api POST "${path}" "${payload}" >/dev/null
  echo "Created CAA ${tag} ${value}"
}

command -v jq >/dev/null || { echo "jq is required (brew install jq)" >&2; exit 1; }

verify_token
resolve_zone_id

echo "Tightening SPF to -all..."
upsert_spf

echo "Adding CAA records..."
upsert_caa "issue" "letsencrypt.org"
upsert_caa "issue" "pki.goog"
upsert_caa "issuewild" ";"
upsert_caa "iodef" "mailto:web@jamestannahill.com"

echo "Done."

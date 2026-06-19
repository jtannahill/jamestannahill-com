#!/usr/bin/env bash
# Attach a CloudFront response headers policy to fonts/media/map distributions.
#
# Prerequisites:
#   export AWS_PROFILE="..."   # account that owns the distributions
#   aws sts get-caller-identity
#
# Usage:
#   ./infra/aws/apply-cloudfront-headers.sh fonts.jamestannahill.com
#   ./infra/aws/apply-cloudfront-headers.sh media.jamestannahill.com
#   ./infra/aws/apply-cloudfront-headers.sh map.jamestannahill.com

set -euo pipefail

DOMAIN="${1:?Usage: $0 <subdomain>}"
POLICY_NAME="jamestannahill-subdomain-security"
POLICY_FILE="$(cd "$(dirname "$0")" && pwd)/response-headers-policy.json"

policy_id=$(aws cloudfront list-response-headers-policies --type custom \
  --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='${POLICY_NAME}'].ResponseHeadersPolicy.Id" \
  --output text)

if [[ -z "${policy_id}" || "${policy_id}" == "None" ]]; then
  policy_id=$(aws cloudfront create-response-headers-policy \
    --response-headers-policy-config "file://${POLICY_FILE}" \
    --query 'ResponseHeadersPolicy.Id' --output text)
  echo "Created response headers policy ${policy_id}"
else
  echo "Using existing response headers policy ${policy_id}"
fi

dist_id=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Aliases.Items && contains(Aliases.Items, '${DOMAIN}')].Id" \
  --output text)

if [[ -z "${dist_id}" || "${dist_id}" == "None" ]]; then
  echo "No CloudFront distribution found for alias ${DOMAIN}" >&2
  exit 1
fi

config=$(aws cloudfront get-distribution-config --id "${dist_id}")
etag=$(echo "${config}" | jq -r '.ETag')
updated=$(echo "${config}" | jq --arg pid "${policy_id}" \
  '.DistributionConfig.ResponseHeadersPolicyId = $pid | .DistributionConfig')

aws cloudfront update-distribution \
  --id "${dist_id}" \
  --if-match "${etag}" \
  --distribution-config "${updated}" >/dev/null

echo "Attached policy ${policy_id} to distribution ${dist_id} (${DOMAIN})"

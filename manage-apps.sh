#!/bin/bash

COMMAND="${1:-"get"}"

OBJECT_URL="s3://${CONFIG_BUCKET}/${APPS_OBJECT_KEY}"
echo "Object URL: ${OBJECT_URL}"

if [ "${COMMAND}" = "get" ]; then
  TEMP="$(mktemp)"
  aws s3 cp "${OBJECT_URL}" "${TEMP}"
  cat "${TEMP}"
  rm -f "${TEMP}"
elif [ "${COMMAND}" = "set" ]; then
  if [ ! -f "${APPS_OBJECT_KEY}" ]; then
    echo "${APPS_OBJECT_KEY} file is not found."
    exit 1
  fi
  aws s3 cp "${APPS_OBJECT_KEY}" "${OBJECT_URL}"
else
  echo "$0 [get|set]"
  exit 1
fi


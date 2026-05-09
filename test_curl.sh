#!/bin/bash

# APIエンドポイントのベースURL
BASE_URL="http://localhost:3000/api/hello/"

echo "テスト1: GET - 正常系（nameパラメータあり）"
curl "${BASE_URL}?name=test"

echo -e "\n"
echo "----------------------------------------"

echo "テスト2: GET - 異常系（nameパラメータなし）"
curl "${BASE_URL}"

echo -e "\n"
echo "----------------------------------------"

echo "テスト3: POST - 正常系（nameパラメータあり）"
curl "${BASE_URL}" --json '{"name":"test"}'

echo -e "\n"
echo "----------------------------------------"

echo "テスト4: POST - 異常系（nameパラメータなし）"
curl "${BASE_URL}" --json '{}'

echo -e "\n"
echo "----------------------------------------"

echo "テスト5: POST - 異常系（nameパラメータが空文字）"
curl "${BASE_URL}" --json '{"name":""}'

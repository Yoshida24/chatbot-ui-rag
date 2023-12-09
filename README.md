# chatbot-ui-rag
chatbot-ui + Pinecone で RAG 構成を実装した実験用アプリケーション

## 実行環境
- Node.js 18 or 19
- M1 Macbooc Air (Sonoma) /Raspberry Pi 4B (2GB, Ubuntu 22.04)

## 準備
- Pinecone のアカウントを取得
- Pinecone に適当なインデックスを作成し、データを登録する
- `.env.local.example` に記載されている Pinecone のシークレット・インデックス情報などを取得

## ローカル実行

```shell
npm i
npm run build
npm start
```

## Configuration

When deploying the application, the following environment variables can be set:

| Environment Variable              | Default value                  | Description                                                                                                                               |
| --------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| OPENAI_API_KEY                    |                                | The default API key used for authentication with OpenAI                                                                                   |
| OPENAI_API_HOST                   | `https://api.openai.com`       | The base url, for Azure use `https://<endpoint>.openai.azure.com`                                                                         |
| OPENAI_API_TYPE                   | `openai`                       | The API type, options are `openai` or `azure`                                                                                             |
| OPENAI_API_VERSION                | `2023-03-15-preview`           | Only applicable for Azure OpenAI                                                                                                          |
| AZURE_DEPLOYMENT_ID               |                                | Needed when Azure OpenAI, Ref [Azure OpenAI API](https://learn.microsoft.com/zh-cn/azure/cognitive-services/openai/reference#completions) |
| OPENAI_ORGANIZATION               |                                | Your OpenAI organization ID                                                                                                               |
| DEFAULT_MODEL                     | `gpt-3.5-turbo`                | The default model to use on new conversations, for Azure use `gpt-35-turbo`                                                               |
| NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT | [see here](utils/app/const.ts) | The default system prompt to use on new conversations                                                                                     |
| NEXT_PUBLIC_DEFAULT_TEMPERATURE   | 1                              | The default temperature to use on new conversations                                                                                       |
| GOOGLE_API_KEY                    |                                | See [Custom Search JSON API documentation][GCSE]                                                                                          |
| GOOGLE_CSE_ID                     |                                | See [Custom Search JSON API documentation][GCSE]                                                                                          |

## WIP: Dockerを使って実行する

```shell
docker build -t chatbot-ui-rag .
docker run -p 3000:3000 \
-e DEFAULT_MODEL_EMBEDDING= \
-e PINECONE_INDEX= \
-e PINECONE_API_KEY= \
-e PINECONE_ENVIRONMENT= \
chatbot-ui-rag
# To add evirionment variables:
# docker run -e OPENAI_API_KEY=xxxxxxxx -p 3000:3000 chatgpt-ui
```

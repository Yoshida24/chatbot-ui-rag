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

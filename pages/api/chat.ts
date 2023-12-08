import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE, OPENAI_API_HOST } from '@/utils/app/const';
import { OpenAIError } from '@/utils/server';
import { Pinecone } from '@pinecone-database/pinecone';

import { ChatBody, Message } from '@/types/chat';

// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';

export const config = {
  runtime: 'edge',
  unstable_allowDynamic: [
    '/node_modules/@pinecone-database/pinecone/**', // use a glob to allow anything in the function-bind 3rd party module
  ],
};

const apiKey = process.env.PINECONE_API_KEY;
const environment = process.env.PINECONE_ENVIRONMENT;
const indexName = process.env.PINECONE_INDEX;
const embeddingmodel = process.env.DEFAULT_MODEL_EMBEDDING;

async function getEmbedding(query: string, openaiKey: string) {
  try {
    const endpoint = 'https://api.openai.com/v1/embeddings';
    const response = await fetch(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify({
          model: embeddingmodel, // 使用するモデル
          input: query
        }),
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching embedding:', error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const { model, messages, key, prompt, temperature } = (await req.json()) as ChatBody;

    await init((imports) => WebAssembly.instantiate(wasm, imports));
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    );

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    let temperatureToUse = temperature;
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE;
    }

    const prompt_tokens = encoding.encode(promptToSend);

    let tokenCount = prompt_tokens.length;
    let messagesToSend: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encoding.encode(message.content);

      if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
        break;
      }
      tokenCount += tokens.length;
      messagesToSend = [message, ...messagesToSend];
    }

    encoding.free();

    const userMessage = messages[messages.length - 1];
    const query = encodeURIComponent(userMessage.content.trim());

    // Transform query to vector
    const xqRaw = await getEmbedding(query, key);
    const xq = xqRaw?.data[0]?.embedding;
    if (xq == null) {
      console.error('Error fetching embedding:', xqRaw);
      return new Response('Error', { status: 500 });
    }

    if (apiKey === undefined || environment === undefined || indexName === undefined) {
      return new Response('Error', { status: 500 });
    }

    // Reatrieve topK results by Pinecone
    const pinecone = new Pinecone({
      apiKey: apiKey,
      environment: environment
    })
    const index = pinecone.index(indexName);
    const queryResponse = await index.query({
      topK: 1,
      vector: xq,
      includeValues: true,
      includeMetadata: true
    });
    const answer = queryResponse.matches[0]

    // Display result
    const top_info = {
      title: answer?.metadata?.title,
      summary: answer?.metadata?.summary,
      score: answer.score,
    }
    const formatted_top_info = `【${top_info.title}】\n\n${top_info.summary}\n\n(Score: ${top_info.score})`

    const RAGAnswerMessage: Message = { role: 'assistant', content: formatted_top_info };
    console.log(formatted_top_info)

    const answerRes = await fetch(`${OPENAI_API_HOST}/v1/chat/completions`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
        ...(process.env.OPENAI_ORGANIZATION && {
          'OpenAI-Organization': process.env.OPENAI_ORGANIZATION,
        }),
      },
      method: 'POST',
      body: JSON.stringify({
        model: model.id,
        messages: [
          {
            role: 'system',
            content: 'あなたはQAbotです。'
              + 'これからあなたには外部の検索システムによって得られた情報と、ユーザーからの質問が与えられます。'
              + 'あなたは得られた情報を元にユーザーの質問に回答します。'
              + ''
              + '### 制約'
              + '- ユーザーの質問に答える際に、あなたは与えられた情報だけを用いて回答します。'
              + '- 回答はマークダウン形式で記述してください。'
              + '- 与えられた情報からユーザーに回答するのに十分な情報が得られない場合は、ユーザーに対して「回答できません」と伝えてください。'
          },
          RAGAnswerMessage,
          userMessage,
        ],
        max_tokens: 512,
        temperature: 1,
        stream: false,
      }),
    });

    const secondRes = await answerRes.json();
    console.log(secondRes)
    const answerToUser = secondRes.choices[0].message.content;

    return new Response(answerToUser + '\n\n---\n\n### 参照した情報\n' + formatted_top_info, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;

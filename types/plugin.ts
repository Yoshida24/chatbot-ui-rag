import { KeyValuePair } from './data';

export interface Plugin {
  id: PluginID;
  name: PluginName;
  requiredKeys: KeyValuePair[];
}

export interface PluginKey {
  pluginId: PluginID;
  requiredKeys: KeyValuePair[];
}

export enum PluginID {
  GOOGLE_SEARCH = 'google-search',
  PINECONE = 'pinecone',
}

export enum PluginName {
  GOOGLE_SEARCH = 'Google Search',
  PINECONE = 'Pinecone',
}

export const Plugins: Record<PluginID, Plugin> = {
  [PluginID.GOOGLE_SEARCH]: {
    id: PluginID.GOOGLE_SEARCH,
    name: PluginName.GOOGLE_SEARCH,
    requiredKeys: [
      {
        key: 'GOOGLE_API_KEY',
        value: '',
      },
      {
        key: 'GOOGLE_CSE_ID',
        value: '',
      },
    ],
  },
  [PluginID.PINECONE]: {
    id: PluginID.PINECONE,
    name: PluginName.PINECONE,
    requiredKeys: [
      {
        key: 'PINECONE_API_KEY',
        value: '',
      },
      {
        key: 'PINECONE_ENVIRONMENT',
        value: '',
      },
      {
        key: 'PINECONE_INDEX',
        value: '',
      },
    ],
  },
};

export const PluginList = Object.values(Plugins);

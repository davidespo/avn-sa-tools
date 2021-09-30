import { init } from '@rematch/core';
import persistPlugin from '@rematch/persist';
import storage from 'redux-persist/lib/storage';
import * as models from './models';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['settings'],
};

const onComplete = () => {
  const { settings } = store.getState();
  if (!!settings.apiKey) {
    console.info('Initializing API Client with persisted API Key');
    store.dispatch.settings.setApiKey(settings.apiKey);
  }
};

const store = init({
  models,
  plugins: [persistPlugin(persistConfig, undefined, undefined, onComplete)],
});

export default store;

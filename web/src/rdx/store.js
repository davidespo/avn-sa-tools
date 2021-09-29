import { init } from '@rematch/core';
import persistPlugin from '@rematch/persist';
import storage from 'redux-persist/lib/storage';
import * as models from './models';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['settings'],
};

const store = init({
  models,
  plugins: [persistPlugin(persistConfig)],
});

export default store;
